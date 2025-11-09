# ML Cybersecurity Detection App

AI-powered web application for malware detection and spam email classification using Random Forest models.

- **Backend**: FastAPI, scikit-learn, Python 3.8+
- **Frontend**: React.js
- **ML Models**: Random Forest Classifiers
- **Deployment**: Docker (optional)

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## Usage

### Spam Detection
1. Navigate to "Spam Detection" tab
2. Paste email content
3. Click "Detect Spam"
4. View prediction with confidence score

### Malware Detection
1. Navigate to "Malware Detection" tab
2. Enter process metrics (or use example data)
3. Click "Detect Malware"
4. View prediction with confidence score

## Model Performance

| Task | Model | F1-Score | Accuracy |
|------|-------|----------|----------|
| Malware | Random Forest | 0.889 | 0.867 |
| Spam | Random Forest | 0.939 | 0.972 |

## API Documentation

Interactive API docs available at `http://localhost:8000/docs` when backend is running.

### Endpoints

**POST /predict/spam**
```json
{
  "email_text": "Your email content here"
}
```

**POST /predict/malware**
```json
{
  "millisecond": 0,
  "static_prio": 14274,
  "utime": 380000,
  ...
}
```

## Project Structure
ml-cybersecurity-app/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   └── ml_models/   # Trained models (.pkl files)
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── notebooks/           # Jupyter notebooks
├── malware_model.ipynb
└── spam_model.ipynb