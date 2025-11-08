"""
FastAPI Backend for ML Cybersecurity Models
Provides endpoints for malware and spam detection
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pickle
import numpy as np
import pandas as pd
from typing import Dict, List, Any
import re

# Initialize FastAPI app
app = FastAPI(
    title="Cybersecurity ML API",
    description="API for malware detection and spam classification",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# LOAD TRAINED MODELS
# ==========================================

def load_models():
    """Load all trained models and preprocessors"""
    models = {}
    
    try:
        # Malware models
        with open('app/ml_models/malware_rf_model.pkl', 'rb') as f:
            models['malware_model'] = pickle.load(f)
        with open('app/ml_models/malware_features.pkl', 'rb') as f:
            models['malware_features'] = pickle.load(f)
        
        # Spam models
        with open('app/ml_models/spam_rf_model.pkl', 'rb') as f:
            models['spam_model'] = pickle.load(f)
        with open('app/ml_models/spam_tfidf.pkl', 'rb') as f:
            models['spam_tfidf'] = pickle.load(f)
        with open('app/ml_models/spam_keywords.pkl', 'rb') as f:
            models['spam_keywords'] = pickle.load(f)
        
        print("✓ All models loaded successfully")
        return models
    
    except Exception as e:
        print(f"Error loading models: {e}")
        raise

# Load models at startup
MODELS = load_models()

# ==========================================
# PYDANTIC MODELS (REQUEST/RESPONSE)
# ==========================================

class MalwareInput(BaseModel):
    """Input schema for malware detection"""
    millisecond: int = Field(..., ge=0, description="Millisecond timestamp")
    state: int
    usage_counter: int
    prio: int
    static_prio: int
    normal_prio: int
    policy: int
    vm_pgoff: int
    vm_truncate_count: int
    task_size: int
    cached_hole_size: int
    free_area_cache: int
    mm_users: int
    map_count: int
    hiwater_rss: int
    total_vm: int
    shared_vm: int
    exec_vm: int
    reserved_vm: int
    nr_ptes: int
    end_data: int
    last_interval: int
    nvcsw: int
    nivcsw: int
    min_flt: int
    maj_flt: int
    fs_excl_counter: int
    lock: int
    utime: int
    stime: int
    gtime: int
    cgtime: int
    signal_nvcsw: int

class SpamInput(BaseModel):
    """Input schema for spam detection"""
    email_text: str = Field(..., min_length=10, description="Email content")

class PredictionResponse(BaseModel):
    """Response schema for predictions"""
    prediction: str
    confidence: float
    probabilities: Dict[str, float]
    details: Dict[str, Any] | None = None

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def extract_spam_features(text: str, keywords: List[str]) -> pd.DataFrame:
    """Extract features from email text"""
    
    # Basic text statistics
    char_count = len(text)
    word_count = len(text.split())
    avg_word_length = char_count / word_count if word_count > 0 else 0
    
    # Special character counts
    exclamation_count = text.count('!')
    question_count = text.count('?')
    dollar_count = text.count('$')
    caps_count = sum(1 for c in text if c.isupper())
    
    # Keyword presence
    text_lower = text.lower()
    keyword_features = {f'has_{kw}': int(kw in text_lower) for kw in keywords}
    
    # Combine all manual features
    features = {
        'char_count': char_count,
        'word_count': word_count,
        'avg_word_length': avg_word_length,
        'exclamation_count': exclamation_count,
        'question_count': question_count,
        'dollar_count': dollar_count,
        'caps_count': caps_count,
        **keyword_features
    }
    
    return pd.DataFrame([features])

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Cybersecurity ML API",
        "endpoints": ["/predict/malware", "/predict/spam"]
    }

@app.post("/predict/malware", response_model=PredictionResponse)
async def predict_malware(data: MalwareInput):
    """
    Predict if process metrics indicate malware
    
    Returns:
        - prediction: 'benign' or 'malware'
        - confidence: probability of predicted class
        - probabilities: probability for each class
    """
    try:
        # Convert input to DataFrame
        input_dict = data.dict()
        input_df = pd.DataFrame([input_dict])
        
        # Ensure correct feature order
        input_df = input_df[MODELS['malware_features']]
        
        # Make prediction
        prediction = MODELS['malware_model'].predict(input_df)[0]
        probabilities = MODELS['malware_model'].predict_proba(input_df)[0]
        
        # Format response
        pred_label = 'malware' if prediction == 1 else 'benign'
        confidence = float(probabilities[prediction])
        
        return PredictionResponse(
            prediction=pred_label,
            confidence=confidence,
            probabilities={
                'benign': float(probabilities[0]),
                'malware': float(probabilities[1])
            },
            details={
                'feature_count': len(MODELS['malware_features']),
                'model': 'Random Forest'
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/spam", response_model=PredictionResponse)
async def predict_spam(data: SpamInput):
    """
    Predict if email text is spam
    
    Returns:
        - prediction: 'ham' or 'spam'
        - confidence: probability of predicted class
        - probabilities: probability for each class
    """
    try:
        # Extract manual features
        manual_features = extract_spam_features(data.email_text, MODELS['spam_keywords'])
        
        # Extract TF-IDF features
        tfidf_features = MODELS['spam_tfidf'].transform([data.email_text])
        tfidf_df = pd.DataFrame(
            tfidf_features.toarray(),
            columns=[f'tfidf_{i}' for i in range(tfidf_features.shape[1])]
        )
        
        # Combine features
        combined_features = pd.concat([manual_features.reset_index(drop=True), tfidf_df], axis=1)
        
        # Make prediction
        prediction = MODELS['spam_model'].predict(combined_features)[0]
        probabilities = MODELS['spam_model'].predict_proba(combined_features)[0]
        
        # Format response
        pred_label = 'spam' if prediction == 1 else 'ham'
        confidence = float(probabilities[prediction])
        
        return PredictionResponse(
            prediction=pred_label,
            confidence=confidence,
            probabilities={
                'ham': float(probabilities[0]),
                'spam': float(probabilities[1])
            },
            details={
                'email_length': len(data.email_text),
                'word_count': len(data.email_text.split()),
                'model': 'Random Forest'
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/models/info")
async def models_info():
    """Get information about loaded models"""
    return {
        "malware": {
            "model_type": "Random Forest",
            "features": len(MODELS['malware_features']),
            "feature_names": MODELS['malware_features'][:5] + ["..."]
        },
        "spam": {
            "model_type": "Random Forest",
            "tfidf_features": MODELS['spam_tfidf'].max_features,
            "manual_features": 16,
            "keywords": MODELS['spam_keywords']
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)