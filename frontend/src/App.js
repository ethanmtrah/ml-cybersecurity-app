import React, { useState } from 'react';
import './App.css';

// API Configuration
const API_URL = 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('spam');
  
  return (
    <div className="App">
      <header className="app-header">
        <h1>🛡️ Cybersecurity ML Detection</h1>
        <p>AI-powered malware and spam detection</p>
      </header>

      <div className="tab-container">
        <button 
          className={`tab ${activeTab === 'spam' ? 'active' : ''}`}
          onClick={() => setActiveTab('spam')}
        >
          Spam Detection
        </button>
        <button 
          className={`tab ${activeTab === 'malware' ? 'active' : ''}`}
          onClick={() => setActiveTab('malware')}
        >
          Malware Detection
        </button>
      </div>

      <div className="content">
        {activeTab === 'spam' ? <SpamDetector /> : <MalwareDetector />}
      </div>

      <footer className="app-footer">
        <p>Powered by Random Forest ML Models | FastAPI + React</p>
      </footer>
    </div>
  );
}

// ==========================================
// SPAM DETECTOR COMPONENT
// ==========================================

function SpamDetector() {
  const [emailText, setEmailText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/predict/spam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_text: emailText }),
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exampleEmails = {
    spam: "CONGRATULATIONS! You've WON $1,000,000! Click here NOW to claim your FREE prize! Limited time offer! ACT FAST!!!",
    ham: "Hi, I wanted to follow up on our meeting yesterday. Could you send me the project timeline when you get a chance? Thanks!"
  };

  return (
    <div className="detector-container">
      <h2>Email Spam Detection</h2>
      <p>Enter email content to check if it's spam or legitimate (ham)</p>

      <div className="example-buttons">
        <button onClick={() => setEmailText(exampleEmails.spam)} className="example-btn spam">
          Load Spam Example
        </button>
        <button onClick={() => setEmailText(exampleEmails.ham)} className="example-btn ham">
          Load Ham Example
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Paste email content here..."
          rows="8"
          required
          minLength="10"
        />
        
        <button type="submit" disabled={loading || emailText.length < 10}>
          {loading ? 'Analyzing...' : 'Detect Spam'}
        </button>
      </form>

      {error && (
        <div className="result-box error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={`result-box ${result.prediction}`}>
          <h3>
            {result.prediction === 'spam' ? 'SPAM DETECTED' : 'LEGITIMATE EMAIL'}
          </h3>
          <div className="confidence-bar">
            <div 
              className="confidence-fill"
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
          <p className="confidence-text">
            Confidence: {(result.confidence * 100).toFixed(2)}%
          </p>
          
          <div className="probabilities">
            <div className="prob-item">
              <span>Ham:</span>
              <span>{(result.probabilities.ham * 100).toFixed(2)}%</span>
            </div>
            <div className="prob-item">
              <span>Spam:</span>
              <span>{(result.probabilities.spam * 100).toFixed(2)}%</span>
            </div>
          </div>

          {result.details && (
            <div className="details">
              <p>Email length: {result.details.email_length} characters</p>
              <p>Word count: {result.details.word_count} words</p>
              <p>Model: {result.details.model}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// MALWARE DETECTOR COMPONENT
// ==========================================

function MalwareDetector() {
  const [formData, setFormData] = useState({
    millisecond: 0,
    state: 0,
    usage_counter: 0,
    prio: 3069378560,
    static_prio: 14274,
    normal_prio: 0,
    policy: 0,
    vm_pgoff: 0,
    vm_truncate_count: 15000,
    task_size: 0,
    cached_hole_size: 0,
    free_area_cache: 0,
    mm_users: 0,
    map_count: 0,
    hiwater_rss: 0,
    total_vm: 0,
    shared_vm: 0,
    exec_vm: 0,
    reserved_vm: 0,
    nr_ptes: 0,
    end_data: 0,
    last_interval: 0,
    nvcsw: 0,
    nivcsw: 0,
    min_flt: 0,
    maj_flt: 120,
    fs_excl_counter: 0,
    lock: 3204448256,
    utime: 380000,
    stime: 4,
    gtime: 0,
    cgtime: 0,
    signal_nvcsw: 0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/predict/malware`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (type) => {
    if (type === 'malware') {
      setFormData({
        ...formData,
        static_prio: 14000,
        utime: 370000,
        free_area_cache: 10000,
        nvcsw: 5
      });
    } else {
      setFormData({
        ...formData,
        static_prio: 25000,
        utime: 410000,
        free_area_cache: 50000,
        nvcsw: 100
      });
    }
  };

  const importantFields = ['static_prio', 'utime', 'free_area_cache', 'nvcsw', 'shared_vm', 'vm_truncate_count'];

  return (
    <div className="detector-container">
      <h2>Malware Process Detection</h2>
      <p>Enter process metrics to detect potential malware</p>

      <div className="example-buttons">
        <button onClick={() => loadExample('malware')} className="example-btn malware">
          Load Malware-like Values
        </button>
        <button onClick={() => loadExample('benign')} className="example-btn benign">
          Load Benign-like Values
        </button>
      </div>

      <form onSubmit={handleSubmit} className="malware-form">
        <div className="form-section">
          <h3>Most Important Features</h3>
          <div className="form-grid">
            {importantFields.map(field => (
              <div key={field} className="form-field">
                <label>{field.replace(/_/g, ' ')}:</label>
                <input
                  type="number"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
        </div>

        <details>
          <summary>Show All 33 Features</summary>
          <div className="form-grid">
            {Object.keys(formData).filter(k => !importantFields.includes(k)).map(field => (
              <div key={field} className="form-field">
                <label>{field.replace(/_/g, ' ')}:</label>
                <input
                  type="number"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
        </details>

        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Detect Malware'}
        </button>
      </form>

      {error && (
        <div className="result-box error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={`result-box ${result.prediction}`}>
          <h3>
            {result.prediction === 'malware' ? 'MALWARE DETECTED' : 'BENIGN PROCESS'}
          </h3>
          <div className="confidence-bar">
            <div 
              className="confidence-fill"
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
          <p className="confidence-text">
            Confidence: {(result.confidence * 100).toFixed(2)}%
          </p>
          
          <div className="probabilities">
            <div className="prob-item">
              <span>Benign:</span>
              <span>{(result.probabilities.benign * 100).toFixed(2)}%</span>
            </div>
            <div className="prob-item">
              <span>Malware:</span>
              <span>{(result.probabilities.malware * 100).toFixed(2)}%</span>
            </div>
          </div>

          {result.details && (
            <div className="details">
              <p>Features analyzed: {result.details.feature_count}</p>
              <p>Model: {result.details.model}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
