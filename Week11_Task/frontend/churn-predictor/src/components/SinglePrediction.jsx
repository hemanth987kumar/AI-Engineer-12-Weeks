import  { useState } from 'react';
import {
  User,
  Building,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Award,
  Zap,
  Globe,
  Activity,
  Wallet,
} from 'lucide-react';
import { predictSingleCustomer } from '../services/api';

const PRESETS = [
  {
    name: 'High Risk Customer',
    badge: 'High Risk',
    color: 'preset-danger',
    data: {
      credit_score: 502,
      country: 'Germany',
      gender: 'Female',
      age: 52,
      tenure: 3,
      balance: 135000,
      products_number: 3,
      credit_card: 1,
      active_member: 0,
      estimated_salary: 115000,
    },
  },
  {
    name: 'Loyal Account',
    badge: 'Low Risk',
    color: 'preset-success',
    data: {
      credit_score: 750,
      country: 'France',
      gender: 'Male',
      age: 33,
      tenure: 7,
      balance: 45000,
      products_number: 2,
      credit_card: 1,
      active_member: 1,
      estimated_salary: 85000,
    },
  },
  {
    name: 'Mid-Tier Account',
    badge: 'Medium Risk',
    color: 'preset-neutral',
    data: {
      credit_score: 619,
      country: 'Spain',
      gender: 'Female',
      age: 42,
      tenure: 2,
      balance: 83807,
      products_number: 1,
      credit_card: 1,
      active_member: 1,
      estimated_salary: 101348,
    },
  },
];

export default function SinglePrediction() {
  const [formData, setFormData] = useState({
    credit_score: 619,
    country: 'France',
    gender: 'Female',
    age: 42,
    tenure: 2,
    balance: 83800,
    products_number: 1,
    credit_card: 1,
    active_member: 1,
    estimated_salary: 101348,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadPreset = (preset) => {
    setFormData(preset.data);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await predictSingleCustomer(formData);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="single-prediction-grid">
      {/* Left Column: Form & Presets */}
      <div className="card form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Customer Profile Information</h2>
            <p className="card-description">
              Provide account metrics to evaluate retention probability using the ML pipeline.
            </p>
          </div>
        </div>

        {/* Preset Quick Loader */}
        <div className="preset-section">
          <span className="preset-label">
            <Sparkles size={14} /> Quick Demo Profiles:
          </span>
          <div className="preset-chips">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={`preset-btn ${preset.color}`}
                onClick={() => loadPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-grid">
            {/* Credit Score */}
            <div className="form-group">
              <label htmlFor="credit_score">
                Credit Score
                <span className="input-hint">{formData.credit_score} / 850</span>
              </label>
              <input
                id="credit_score"
                type="range"
                min="300"
                max="850"
                step="1"
                value={formData.credit_score}
                onChange={(e) => handleChange('credit_score', Number(e.target.value))}
                className="range-input"
              />
              <div className="range-labels">
                <span>300 (Poor)</span>
                <span>580 (Fair)</span>
                <span>670 (Good)</span>
                <span>850 (Excellent)</span>
              </div>
            </div>

            {/* Age */}
            <div className="form-group">
              <label htmlFor="age">Customer Age</label>
              <div className="input-with-icon">
                <User className="input-icon" size={16} />
                <input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  required
                  value={formData.age}
                  onChange={(e) => handleChange('age', Number(e.target.value))}
                  placeholder="e.g. 42"
                />
              </div>
            </div>

            {/* Country */}
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <div className="input-with-icon">
                <Building className="input-icon" size={16} />
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                >
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Spain">Spain</option>
                </select>
              </div>
            </div>

            {/* Gender */}
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            {/* Tenure */}
            <div className="form-group">
              <label htmlFor="tenure">Tenure with Bank (Years)</label>
              <input
                id="tenure"
                type="number"
                min="0"
                max="15"
                required
                value={formData.tenure}
                onChange={(e) => handleChange('tenure', Number(e.target.value))}
                placeholder="e.g. 2"
              />
            </div>

            {/* Products Number */}
            <div className="form-group">
              <label htmlFor="products_number">Number of Products</label>
              <div className="pill-selector">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`pill-option ${formData.products_number === num ? 'active' : ''}`}
                    onClick={() => handleChange('products_number', num)}
                  >
                    {num} {num === 1 ? 'Product' : 'Products'}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Balance */}
            <div className="form-group">
              <label htmlFor="balance">Account Balance ($)</label>
              <div className="input-with-icon">
                <DollarSign className="input-icon" size={16} />
                <input
                  id="balance"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.balance}
                  onChange={(e) => handleChange('balance', Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Estimated Salary */}
            <div className="form-group">
              <label htmlFor="estimated_salary">Estimated Annual Salary ($)</label>
              <div className="input-with-icon">
                <DollarSign className="input-icon" size={16} />
                <input
                  id="estimated_salary"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.estimated_salary}
                  onChange={(e) => handleChange('estimated_salary', Number(e.target.value))}
                  placeholder="100000.00"
                />
              </div>
            </div>

            {/* Credit Card Holder */}
            <div className="form-group">
              <label>Has Credit Card?</label>
              <div className="radio-tile-group">
                <label className={`radio-tile ${formData.credit_card === 1 ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="credit_card"
                    checked={formData.credit_card === 1}
                    onChange={() => handleChange('credit_card', 1)}
                  />
                  <span>Yes, Holds Card</span>
                </label>
                <label className={`radio-tile ${formData.credit_card === 0 ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="credit_card"
                    checked={formData.credit_card === 0}
                    onChange={() => handleChange('credit_card', 0)}
                  />
                  <span>No Card</span>
                </label>
              </div>
            </div>

            {/* Active Member */}
            <div className="form-group">
              <label>Active Bank Member?</label>
              <div className="radio-tile-group">
                <label className={`radio-tile ${formData.active_member === 1 ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="active_member"
                    checked={formData.active_member === 1}
                    onChange={() => handleChange('active_member', 1)}
                  />
                  <span>Yes, Active</span>
                </label>
                <label className={`radio-tile ${formData.active_member === 0 ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="active_member"
                    checked={formData.active_member === 0}
                    onChange={() => handleChange('active_member', 0)}
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert-box alert-error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-footer">
            <button type="submit" className="submit-btn primary" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="spin" size={18} />
                  <span>Computing Prediction...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Predict Churn Likelihood</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Prediction Results & Insights */}
      <div className="card result-card">
        <div className="card-header">
          <h2 className="card-title">Model Evaluation</h2>
          <span className="badge-model">RandomForest Classifier</span>
        </div>

        {result ? (
          <div className="result-container">
            {/* Churn Verdict Header */}
            {/* Churn Verdict Header */}
            <div
              className={`verdict-banner ${
                result.churn === 1 ? 'verdict-churn' : 'verdict-stay'
              }`}
            >
              <div className="verdict-icon-box">
                {result.churn === 1 ? (
                  <TrendingDown size={22} />
                ) : (
                  <TrendingUp size={22} />
                )}
              </div>
              <div className="verdict-text-wrap">
                <span className="verdict-tag">
                  {result.churn === 1 ? 'CHURN RISK DETECTED' : 'LOYAL RETENTION'}
                </span>
                <h3 className="verdict-headline">{result.label}</h3>
              </div>
            </div>

            {/* Risk Meter Gauge with Integrated Risk Classification */}
            <div className="metric-box">
              <div className="metric-header">
                <div className="metric-title-group">
                  <span className="metric-title">Churn Probability</span>
                  <span
                    className={`risk-badge risk-${(result.risk_level || 'low').toLowerCase()}`}
                  >
                    {result.risk_level} Risk
                  </span>
                </div>
                <span className="metric-value">
                  {result.probability_percent}%
                </span>
              </div>
              <div className="meter-track">
                <div
                  className={`meter-fill ${
                    result.risk_level === 'High'
                      ? 'fill-high'
                      : result.risk_level === 'Medium'
                      ? 'fill-medium'
                      : 'fill-low'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, result.probability_percent))}%` }}
                ></div>
              </div>
              <div className="meter-legend">
                <span className="legend-low">0% Safe</span>
                <span className="legend-mid">50% Threshold</span>
                <span className="legend-high">100% Critical</span>
              </div>
            </div>

            {/* Retention Strategy Action Plan */}
            <div className="action-box">
              <div className="action-header-row">
                <div className="action-title">
                  <Award size={15} />
                  <span>Retention Action</span>
                </div>
                {result.recommendation && result.recommendation.includes(': ') && (
                  <span
                    className={`strategy-status-badge badge-${(
                      result.risk_level || 'low'
                    ).toLowerCase()}`}
                  >
                    <span className="pulse-dot"></span>
                    <span>
                      {(() => {
                        const level = (result.risk_level || '').toLowerCase();
                        if (level === 'high') return 'Immediate Action';
                        if (level === 'medium') return 'Moderate Risk';
                        return 'Healthy Customer';
                      })()}
                    </span>
                  </span>
                )}
              </div>
              <p className="action-text">
                {result.recommendation && result.recommendation.includes(': ')
                  ? result.recommendation.split(': ').slice(1).join(': ')
                  : result.recommendation ||
                    'Engage proactively with personalized rewards and check-in calls.'}
              </p>
            </div>

            {/* Key Profile Drivers - Compact & Simple */}
            <div className="factors-box compact">
              <div className="factors-header">
                <div className="factors-title-wrap">
                  <Sparkles size={13} className="factors-header-icon" />
                  <h4 className="factors-title">Key Profile Drivers</h4>
                </div>
                <span className="factors-subtitle">Model Context</span>
              </div>

              <div className="drivers-compact-list">
                {/* Driver 1: Geography & Demographics */}
                <div className="driver-compact-row">
                  <div className="driver-compact-left">
                    <div className="driver-icon-pill icon-blue">
                      <Globe size={13} />
                    </div>
                    <span className="driver-compact-label">Geography & Age</span>
                  </div>
                  <div className="driver-compact-val">
                    <span>{formData.country} resident</span>
                    <span className="driver-dot">•</span>
                    <span>{formData.age} yrs</span>
                  </div>
                </div>

                {/* Driver 2: Banking Engagement */}
                <div className="driver-compact-row">
                  <div className="driver-compact-left">
                    <div className={`driver-icon-pill ${formData.active_member === 1 ? 'icon-green' : 'icon-amber'}`}>
                      <Activity size={13} />
                    </div>
                    <span className="driver-compact-label">Banking Activity</span>
                  </div>
                  <div className="driver-compact-val">
                    <span className={`status-indicator-pill ${formData.active_member === 1 ? 'status-active' : 'status-inactive'}`}>
                      {formData.active_member === 1 ? 'Active Member' : 'Inactive'}
                    </span>
                    <span className="driver-dot">•</span>
                    <span>{formData.products_number} {formData.products_number === 1 ? 'product' : 'products'}</span>
                  </div>
                </div>

                {/* Driver 3: Capital & Liquidity */}
                <div className="driver-compact-row">
                  <div className="driver-compact-left">
                    <div className="driver-icon-pill icon-emerald">
                      <Wallet size={13} />
                    </div>
                    <span className="driver-compact-label">Capital Stored</span>
                  </div>
                  <div className="driver-compact-val font-mono">
                    <span className="driver-highlight">${Number(formData.balance).toLocaleString()}</span>
                    <span className="driver-dot">•</span>
                    <span className="driver-subtext">Credit: {formData.credit_score}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-result-state">
            <div className="empty-icon-circle">
              <CheckCircle2 size={36} />
            </div>
            <h3>Ready for Prediction</h3>
            <p>
              Fill out the customer parameters on the left or select a quick demo profile, then click
              <strong> "Predict Churn Likelihood"</strong> to see AI inference results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

