import React, { useState, useEffect } from 'react';
import './App.css';

// API Configuration
const API_URL = 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('spam');
  const [predictionHistory, setPredictionHistory] = useState({
    spam: [],
    malware: []
  });
  
  return (
    <div className="App">
      <header className="app-header">
        <h1>Cybersecurity AI App</h1>
        <p>Advanced AI-driven malware and spam detection with real-time analytics</p>
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
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics Dashboard
        </button>
      </div>

      <div className="content">
        {activeTab === 'spam' && <SpamDetector predictionHistory={predictionHistory} setPredictionHistory={setPredictionHistory} />}
        {activeTab === 'malware' && <MalwareDetector predictionHistory={predictionHistory} setPredictionHistory={setPredictionHistory} />}
        {activeTab === 'analytics' && <AnalyticsDashboard predictionHistory={predictionHistory} />}
      </div>

      <footer className="app-footer">
        <p>Powered by Random Forest ML Models | FastAPI + React + D3.js | Real-time Threat Analytics</p>
      </footer>
    </div>
  );
}

// ==========================================
// ANALYTICS DASHBOARD WITH D3.JS CHARTS
// ==========================================

function AnalyticsDashboard({ predictionHistory }) {
  const [modelStats, setModelStats] = useState(null);
  const [threatTrends, setThreatTrends] = useState([]);

  useEffect(() => {
    // Fetch model info from API
    fetch(`${API_URL}/models/info`)
      .then(res => res.json())
      .then(data => setModelStats(data))
      .catch(err => console.error('Error fetching model stats:', err));

    // Generate threat trends (simulated real-time data)
    const interval = setInterval(() => {
      setThreatTrends(prev => {
        const newData = [...prev];
        const timestamp = new Date();
        
        // Simulate threat detection over time
        newData.push({
          time: timestamp.toLocaleTimeString(),
          spam: Math.floor(Math.random() * 20) + 5,
          malware: Math.floor(Math.random() * 15) + 3
        });

        // Keep only last 20 data points
        if (newData.length > 20) newData.shift();
        return newData;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="analytics-container">
      <div className="charts-container">
        <div className="chart-box">
          <h3>Prediction Confidence Distribution</h3>
          <ConfidenceChart predictionHistory={predictionHistory} />
        </div>

        <div className="chart-box">
          <h3>Threat Detection Trends (Simulated - randomly generated data)</h3>
          <ThreatTrendsChart data={threatTrends} />
        </div>
      </div>

      {modelStats && (
        <div className="model-info-box">
          <h3>🤖 Model Information</h3>
          <div className="model-grid">
            <div className="model-card">
              <h4>Spam Detection Model</h4>
              <p><strong>Type:</strong> {modelStats.spam.model_type}</p>
              <p><strong>TF-IDF Features:</strong> {modelStats.spam.tfidf_features}</p>
              <p><strong>Manual Features:</strong> {modelStats.spam.manual_features}</p>
              <p><strong>Keywords:</strong> {modelStats.spam.keywords.join(', ')}</p>
            </div>
            <div className="model-card">
              <h4>Malware Detection Model</h4>
              <p><strong>Type:</strong> {modelStats.malware.model_type}</p>
              <p><strong>Total Features:</strong> {modelStats.malware.features}</p>
              <p><strong>Top Features:</strong> {modelStats.malware.feature_names.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// STAT CARD COMPONENT
// ==========================================

function StatCard({ title, value, icon, color }) {
  return (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <div className="stat-content">
        <h4>{title}</h4>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

// ==========================================
// D3.JS CHART 1: CONFIDENCE DISTRIBUTION
// ==========================================

function ConfidenceChart({ predictionHistory }) {
  const svgRef = React.useRef();
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!svgRef.current) return;

    // Combine and filter data
    let allPredictions = [
      ...predictionHistory.spam.map(p => ({ ...p, type: 'spam' })),
      ...predictionHistory.malware.map(p => ({ ...p, type: 'malware' }))
    ];

    if (filterType !== 'all') {
      allPredictions = allPredictions.filter(p => p.type === filterType);
    }

    if (allPredictions.length === 0) return;

    // Clear previous chart
    const svg = window.d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Create bins for histogram
    const bins = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const histogram = bins.slice(0, -1).map((bin, i) => {
      const count = allPredictions.filter(p => 
        p.confidence >= bin && p.confidence < bins[i + 1]
      ).length;
      return { bin: `${(bin * 100).toFixed(0)}-${(bins[i + 1] * 100).toFixed(0)}%`, count };
    });

    // Scales
    const x = window.d3.scaleBand()
      .domain(histogram.map(d => d.bin))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = window.d3.scaleLinear()
      .domain([0, window.d3.max(histogram, d => d.count) || 10])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Draw bars
    svg.selectAll("rect")
      .data(histogram)
      .join("rect")
      .attr("x", d => x(d.bin))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.count))
      .attr("fill", "#667eea")
      .attr("opacity", 0.8)
      .on("mouseover", function(event, d) {
        window.d3.select(this).attr("opacity", 1);
        // Show tooltip
        svg.append("text")
          .attr("class", "tooltip")
          .attr("x", x(d.bin) + x.bandwidth() / 2)
          .attr("y", y(d.count) - 5)
          .attr("text-anchor", "middle")
          .style("fill", "#333")
          .style("font-weight", "bold")
          .text(d.count);
      })
      .on("mouseout", function() {
        window.d3.select(this).attr("opacity", 0.8);
        svg.selectAll(".tooltip").remove();
      });

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(window.d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Y axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(window.d3.axisLeft(y));

    // Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", -(height / 2))
      .style("text-anchor", "middle")
      .text("Count");

  }, [predictionHistory, filterType]);

  return (
    <div className="chart-wrapper">
      <div className="chart-filters">
        <button 
          className={filterType === 'all' ? 'filter-active' : ''}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        <button 
          className={filterType === 'spam' ? 'filter-active' : ''}
          onClick={() => setFilterType('spam')}
        >
          Spam Only
        </button>
        <button 
          className={filterType === 'malware' ? 'filter-active' : ''}
          onClick={() => setFilterType('malware')}
        >
          Malware Only
        </button>
      </div>
      <svg ref={svgRef} width="550" height="300"></svg>
    </div>
  );
}

// ==========================================
// D3.JS CHART 2: LIVE THREAT TRENDS
// ==========================================

function ThreatTrendsChart({ data }) {
  const svgRef = React.useRef();

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = window.d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 550;
    const height = 300;
    const margin = { top: 20, right: 80, bottom: 40, left: 50 };

    // Scales
    const x = window.d3.scalePoint()
      .domain(data.map(d => d.time))
      .range([margin.left, width - margin.right]);

    const y = window.d3.scaleLinear()
      .domain([0, window.d3.max(data, d => Math.max(d.spam, d.malware)) || 50])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Line generators
    const spamLine = window.d3.line()
      .x(d => x(d.time))
      .y(d => y(d.spam))
      .curve(window.d3.curveMonotoneX);

    const malwareLine = window.d3.line()
      .x(d => x(d.time))
      .y(d => y(d.malware))
      .curve(window.d3.curveMonotoneX);

    // Draw spam line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#e74c3c")
      .attr("stroke-width", 3)
      .attr("d", spamLine);

    // Draw malware line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#e67e22")
      .attr("stroke-width", 3)
      .attr("d", malwareLine);

    // Add circles for spam data points
    svg.selectAll(".spam-dot")
      .data(data)
      .join("circle")
      .attr("class", "spam-dot")
      .attr("cx", d => x(d.time))
      .attr("cy", d => y(d.spam))
      .attr("r", 4)
      .attr("fill", "#e74c3c")
      .on("mouseover", function(event, d) {
        window.d3.select(this).attr("r", 6);
        // Show value
        svg.append("text")
          .attr("class", "hover-text")
          .attr("x", x(d.time))
          .attr("y", y(d.spam) - 10)
          .attr("text-anchor", "middle")
          .style("fill", "#e74c3c")
          .style("font-weight", "bold")
          .text(d.spam);
      })
      .on("mouseout", function() {
        window.d3.select(this).attr("r", 4);
        svg.selectAll(".hover-text").remove();
      });

    // Add circles for malware data points
    svg.selectAll(".malware-dot")
      .data(data)
      .join("circle")
      .attr("class", "malware-dot")
      .attr("cx", d => x(d.time))
      .attr("cy", d => y(d.malware))
      .attr("r", 4)
      .attr("fill", "#e67e22")
      .on("mouseover", function(event, d) {
        window.d3.select(this).attr("r", 6);
        svg.append("text")
          .attr("class", "hover-text")
          .attr("x", x(d.time))
          .attr("y", y(d.malware) - 10)
          .attr("text-anchor", "middle")
          .style("fill", "#e67e22")
          .style("font-weight", "bold")
          .text(d.malware);
      })
      .on("mouseout", function() {
        window.d3.select(this).attr("r", 4);
        svg.selectAll(".hover-text").remove();
      });

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(window.d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 3 === 0)))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Y axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(window.d3.axisLeft(y));

    // Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", -(height / 2))
      .style("text-anchor", "middle")
      .text("Threats Detected");

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 70}, 20)`);

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "#e74c3c")
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 5)
      .text("Spam")
      .style("font-size", "12px");

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 20)
      .attr("y2", 20)
      .attr("stroke", "#e67e22")
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 25)
      .text("Malware")
      .style("font-size", "12px");

  }, [data]);

  return (
    <div className="chart-wrapper">
      <svg ref={svgRef} width="550" height="300"></svg>
      <p className="chart-note">📡 Live simulation - updates every 3 seconds</p>
    </div>
  );
}

// Helper function
function calculateDetectionRate(predictions) {
  if (predictions.length === 0) return '0%';
  const detected = predictions.filter(p => 
    (p.type === 'spam' && p.prediction === 'spam') ||
    (p.type === 'malware' && p.prediction === 'malware')
  ).length;
  return `${((detected / predictions.length) * 100).toFixed(1)}%`;
}

// ==========================================
// SPAM DETECTOR COMPONENT (Enhanced)
// ==========================================

function SpamDetector({ predictionHistory, setPredictionHistory }) {
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
      
      // Add to history
      setPredictionHistory(prev => ({
        ...prev,
        spam: [...prev.spam, { ...data, type: 'spam', timestamp: new Date() }]
      }));
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
// MALWARE DETECTOR COMPONENT (Enhanced)
// ==========================================

function MalwareDetector({ predictionHistory, setPredictionHistory }) {
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
      
      // Add to history
      setPredictionHistory(prev => ({
        ...prev,
        malware: [...prev.malware, { ...data, type: 'malware', timestamp: new Date() }]
      }));
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
        static_prio: 25000,
        utime: 410000,
        free_area_cache: 50000,
        nvcsw: 100
      });
    } else {
      setFormData({
        ...formData,
        static_prio: 14000,
        utime: 370000,
        free_area_cache: 10000,
        nvcsw: 5
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
          <h3>🔑 Most Important Features</h3>
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
