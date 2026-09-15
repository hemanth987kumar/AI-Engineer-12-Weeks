import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  Search,
  Users,
  UserX,
  TrendingDown,
  PieChart,
  RefreshCw,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  LayoutList,
} from 'lucide-react';
import { predictFromFile, getSampleCsvUrl } from '../services/api';

export default function BatchPrediction() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL'); // 'ALL' | 'CHURN' | 'STAY' | 'HIGH_RISK'

  // Strategy Density View Mode: 'compact' (slim single-line rows) | 'expanded' (full multiline)
  const [strategyViewMode, setStrategyViewMode] = useState('compact');

  // Selected record for interactive Retention Playbook Modal
  const [selectedPlaybookRecord, setSelectedPlaybookRecord] = useState(null);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // Pagination for large datasets (e.g. 1,000+ rows)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10, 20, 50, 100, 'ALL'

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const validExts = ['csv', 'xlsx', 'xls', 'txt'];
    if (!validExts.includes(ext)) {
      setError(`Unsupported file type (.${ext}). Please upload a .csv, .xlsx, .xls, or .txt file.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const processFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const data = await predictFromFile(selectedFile);
      setBatchResult(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Batch prediction failed. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const exportResultsCsv = () => {
    if (!batchResult || !batchResult.records.length) return;

    const headers = [
      'row_index',
      'customer_id',
      'churn_prediction',
      'verdict',
      'churn_probability_pct',
      'risk_level',
      'credit_score',
      'country',
      'gender',
      'age',
      'tenure',
      'balance',
      'products_number',
      'credit_card',
      'active_member',
      'estimated_salary',
      'recommendation',
    ];

    const rows = batchResult.records.map((r) => [
      r.row_index,
      r.customer_id || '',
      r.churn,
      r.label,
      r.probability_percent,
      r.risk_level,
      r.credit_score,
      r.country,
      r.gender,
      r.age,
      r.tenure,
      r.balance,
      r.products_number,
      r.credit_card,
      r.active_member,
      r.estimated_salary,
      `"${(r.recommendation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `predicted_${batchResult.filename || 'customers'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setSelectedFile(null);
    setBatchResult(null);
    setError(null);
    setSearchTerm('');
    setFilterRisk('ALL');
    setCurrentPage(1);
    setPageSize(10);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered records
  const filteredRecords = (batchResult?.records || []).filter((record) => {
    // Filter by risk/verdict
    if (filterRisk === 'CHURN' && record.churn !== 1) return false;
    if (filterRisk === 'STAY' && record.churn !== 0) return false;
    if (filterRisk === 'HIGH_RISK' && record.risk_level !== 'High') return false;

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = (record.customer_id || '').toLowerCase().includes(q);
      const matchCountry = (record.country || '').toLowerCase().includes(q);
      const matchGender = (record.gender || '').toLowerCase().includes(q);
      const matchIndex = String(record.row_index).includes(q);
      return matchId || matchCountry || matchGender || matchIndex;
    }

    return true;
  });

  // Pagination calculations
  const totalFiltered = filteredRecords.length;
  const isAll = pageSize === 'ALL';
  const effectivePageSize = isAll ? (totalFiltered || 1) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isAll ? 0 : (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = isAll ? totalFiltered : Math.min(startIndex + effectivePageSize, totalFiltered);
  const displayedRecords = isAll ? filteredRecords : filteredRecords.slice(startIndex, endIndex);

  // Generate numbered pages list: 1 2 3 4 5 6 7 8 9...
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPlaybookRecord(null);
      }
    };
    if (selectedPlaybookRecord) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlaybookRecord]);

  // Normalizes urgency tags into simple, intuitive 2-word labels
  const getTwoWordTag = (rawTag, riskLevel) => {
    const level = (riskLevel || '').toLowerCase();
    const lower = (rawTag || '').toLowerCase();
    if (level === 'high' || lower.includes('immediate')) {
      return 'Immediate Action';
    }
    if (level === 'medium' || lower.includes('moderate')) {
      return 'Moderate Risk';
    }
    if (level === 'low' || lower.includes('healthy')) {
      return 'Healthy Customer';
    }
    return rawTag || 'Action Plan';
  };

  // Splits backend recommendation into 2-word urgency tag and action detail text
  const parseStrategy = (rec, riskLevel) => {
    if (!rec) return { tag: 'Healthy Customer', details: 'Maintain regular relationship cadence.', fullTag: 'Healthy customer relationship' };
    const parts = rec.split(': ');
    if (parts.length > 1) {
      return { 
        tag: getTwoWordTag(parts[0], riskLevel), 
        details: parts.slice(1).join(': '),
        fullTag: parts[0]
      };
    }
    return { tag: getTwoWordTag(rec, riskLevel), details: rec, fullTag: rec };
  };

  // Copies executive retention memo to clipboard
  const copyPlaybookMemo = (record) => {
    if (!record) return;
    const memo = `[CUSTOMER RETENTION PLAYBOOK MEMO]
Customer ID: ${record.customer_id || `ID-${record.row_index}`}
Risk Tier: ${record.risk_level} (${record.probability_percent}% Churn Probability)
Predicted Verdict: ${record.label}
Demographics: ${record.age}y old ${record.gender}, ${record.country}
Account Details: Credit Score ${record.credit_score} | Balance $${Number(record.balance).toLocaleString()} | Products: ${record.products_number} | Member Status: ${record.active_member === 1 ? 'Active' : 'Inactive'}
Action Strategy: ${record.recommendation || 'Standard engagement'}`;

    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  // Navigates between customer records inside the modal without closing it
  const handleModalNav = (direction) => {
    if (!selectedPlaybookRecord || displayedRecords.length === 0) return;
    const currentIndex = displayedRecords.findIndex(
      (r) => r.row_index === selectedPlaybookRecord.row_index
    );
    if (currentIndex === -1) return;
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % displayedRecords.length
        : (currentIndex - 1 + displayedRecords.length) % displayedRecords.length;
    setSelectedPlaybookRecord(displayedRecords[nextIndex]);
    setCopiedMemo(false);
  };

  // Generates structured retention execution steps based on risk tier
  const getPlaybookChecklist = (riskLevel) => {
    const level = (riskLevel || 'low').toLowerCase();
    if (level === 'high') {
      return [
        {
          step: '1',
          title: 'Immediate 1-on-1 Outreach',
          desc: 'Assign dedicated senior loyalty manager within 24 hours for direct phone outreach.',
        },
        {
          step: '2',
          title: 'Fee Waiver & Pricing Concession',
          desc: 'Waive upcoming maintenance or transaction fees for 12 months to eliminate immediate friction.',
        },
        {
          step: '3',
          title: 'Tailored Financial Incentive',
          desc: 'Offer preferential interest rates on deposits or customized loan restructuring.',
        },
      ];
    } else if (level === 'medium') {
      return [
        {
          step: '1',
          title: 'Targeted Experience Survey',
          desc: 'Deploy a quick 2-question digital pulse survey to identify recent service dissatisfaction.',
        },
        {
          step: '2',
          title: 'Loyalty Tier Fast-Track',
          desc: 'Enroll customer into enhanced rewards tier with higher cashback or bonus partner points.',
        },
        {
          step: '3',
          title: 'Cross-Sell Portfolio Consultation',
          desc: 'Introduce multi-product bundled packages to increase customer switching barriers.',
        },
      ];
    } else {
      return [
        {
          step: '1',
          title: 'Relationship Continuity Cadence',
          desc: 'Maintain standard bi-annual relationship check-ins and curated market trend updates.',
        },
        {
          step: '2',
          title: 'Exclusive Client Referral Perks',
          desc: 'Invite client into VIP referral network with reciprocal deposit rewards.',
        },
        {
          step: '3',
          title: 'Wealth Advisory Enhancement',
          desc: 'Present premier investment and asset planning options based on high account balance.',
        },
      ];
    }
  };

  // Highlights the urgency tag distinctly
  const renderStrategy = (rec, riskLevel) => {
    if (!rec) return null;
    const { tag, details } = parseStrategy(rec, riskLevel);
    return (
      <div className="strategy-content">
        <div className="strategy-header">
          <span className={`strategy-badge badge-${(riskLevel || 'low').toLowerCase()}`}>
            {tag}
          </span>
        </div>
        <p className="strategy-details">{details}</p>
      </div>
    );
  };

  return (
    <div className="batch-container">
      {/* Upload Box Card */}
      <div className="card upload-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Batch Customer Prediction & File Ingestion</h2>
            <p className="card-description">
              Upload multi-row customer datasets in <strong>CSV, Excel (.xlsx, .xls), or TXT</strong> format to run high-throughput batch inference.
            </p>
          </div>
          <a
            href={getSampleCsvUrl()}
            download="bank_churn_sample.csv"
            className="sample-download-btn"
            title="Download formatted sample CSV"
          >
            <Download size={15} />
            <span>Download Sample CSV</span>
          </a>
        </div>

        {/* Drag & Drop Area */}
        <div
          className={`dropzone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'file-ready' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls, .txt, text/csv, text/plain, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {selectedFile ? (
            <div className="dropzone-file-info">
              <FileCheck size={48} className="drop-icon-active" />
              <div className="drop-text">
                <h3 className="file-name">{selectedFile.name}</h3>
                <p className="file-meta">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for ML prediction
                </p>
              </div>
              <button
                type="button"
                className="change-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Change File
              </button>
            </div>
          ) : (
            <div className="dropzone-prompt">
              <UploadCloud size={48} className="drop-icon" />
              <h3>Drag & drop your customer file here</h3>
              <p>or click to browse from your computer</p>
              <div className="file-types-supported">
                <span className="type-pill">
                  <FileSpreadsheet size={13} /> .CSV
                </span>
                <span className="type-pill">
                  <FileSpreadsheet size={13} /> .XLSX / .XLS
                </span>
                <span className="type-pill">
                  <FileText size={13} /> .TXT (Delimited)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="upload-actions">
          {selectedFile && (
            <button
              type="button"
              className="submit-btn primary"
              onClick={processFile}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="spin" size={18} />
                  <span>Processing Dataset & Computing Inference...</span>
                </>
              ) : (
                <>
                  <FileCheck size={18} />
                  <span>Run Batch Prediction on {selectedFile.name}</span>
                </>
              )}
            </button>
          )}

          {batchResult && (
            <button type="button" className="secondary-btn" onClick={resetAll}>
              Upload Another File
            </button>
          )}
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Results View */}
      {batchResult && (
        <div className="results-section">
          {/* Summary Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap icon-blue">
                <Users size={22} />
              </div>
              <div className="stat-data">
                <span className="stat-label">Total Records Evaluated</span>
                <span className="stat-value">{batchResult.summary.total_records.toLocaleString()}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-red">
                <UserX size={22} />
              </div>
              <div className="stat-data">
                <span className="stat-label">Customers At Churn Risk</span>
                <span className="stat-value">{batchResult.summary.churn_count.toLocaleString()}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-amber">
                <TrendingDown size={22} />
              </div>
              <div className="stat-data">
                <span className="stat-label">Overall Churn Rate</span>
                <span className="stat-value">{batchResult.summary.churn_rate_pct}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap icon-purple">
                <PieChart size={22} />
              </div>
              <div className="stat-data">
                <span className="stat-label">High Risk Interventions</span>
                <span className="stat-value">{batchResult.summary.high_risk_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Table Header & Controls */}
          <div className="card table-card">
            <div className="table-toolbar">
              <div className="table-title-group">
                <h3 className="card-title">Prediction Breakdown</h3>
                <span className="badge-records">
                  Showing {totalFiltered === 0 ? 0 : startIndex + 1}–{endIndex} of {totalFiltered} records {totalFiltered !== batchResult.records.length ? `(filtered from ${batchResult.records.length})` : ''}
                </span>
              </div>

              <div className="table-controls">
                {/* Search Bar */}
                <div className="table-search">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by ID, Country, Gender..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Filter Selector */}
                <div className="table-filter-tabs">
                  <button
                    type="button"
                    className={`filter-btn ${filterRisk === 'ALL' ? 'active' : ''}`}
                    onClick={() => {
                      setFilterRisk('ALL');
                      setCurrentPage(1);
                    }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${filterRisk === 'CHURN' ? 'active danger' : ''}`}
                    onClick={() => {
                      setFilterRisk('CHURN');
                      setCurrentPage(1);
                    }}
                  >
                    Churn Risk ({batchResult.summary.churn_count})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${filterRisk === 'STAY' ? 'active success' : ''}`}
                    onClick={() => {
                      setFilterRisk('STAY');
                      setCurrentPage(1);
                    }}
                  >
                    Stay ({batchResult.summary.stay_count})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${filterRisk === 'HIGH_RISK' ? 'active warn' : ''}`}
                    onClick={() => {
                      setFilterRisk('HIGH_RISK');
                      setCurrentPage(1);
                    }}
                  >
                    High Risk ({batchResult.summary.high_risk_count})
                  </button>
                </div>

                {/* View Density Switcher & Export CSV */}
                <div className="table-actions-group">
                  <div className="density-toggle-group" title="Toggle Strategy column row height & density">
                    <button
                      type="button"
                      className={`density-btn ${strategyViewMode === 'compact' ? 'active' : ''}`}
                      onClick={() => setStrategyViewMode('compact')}
                      title="Compact slim rows"
                    >
                      <LayoutList size={13} />
                      <span>Compact</span>
                    </button>
                    <button
                      type="button"
                      className={`density-btn ${strategyViewMode === 'expanded' ? 'active' : ''}`}
                      onClick={() => setStrategyViewMode('expanded')}
                      title="Expanded multiline view"
                    >
                      <span>Expanded</span>
                    </button>
                  </div>

                  <button type="button" className="export-csv-btn" onClick={exportResultsCsv}>
                    <Download size={15} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="table-scroll-wrap">
              <table className="prediction-table">
                <thead>
                  <tr>
                    <th className="th-num">#</th>
                    <th className="th-id">Customer ID</th>
                    <th className="th-verdict">Verdict</th>
                    <th className="th-prob">Churn Probability</th>
                    <th className="th-tier">Risk Tier</th>
                    <th className="th-score">Credit Score</th>
                    <th className="th-country">Country</th>
                    <th className="th-profile">Age / Gender</th>
                    <th className="th-prod">Products</th>
                    <th className="th-balance">Balance</th>
                    <th className="th-active">Active</th>
                    <th className="th-action-col">Action Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRecords.length > 0 ? (
                    displayedRecords.map((record) => {
                      const parsed = parseStrategy(record.recommendation, record.risk_level);
                      const riskKey = (record.risk_level || 'low').toLowerCase();

                      return (
                        <tr
                          key={record.row_index}
                          className={record.churn === 1 ? 'row-churn-warning' : ''}
                        >
                          <td className="cell-num cell-muted">{record.row_index}</td>
                          <td className="cell-id cell-mono font-bold">
                            {record.customer_id || `ID-${record.row_index}`}
                          </td>
                          <td className="cell-verdict">
                            <span
                              className={`badge-pill ${
                                record.churn === 1 ? 'badge-danger' : 'badge-success'
                              }`}
                            >
                              {record.label}
                            </span>
                          </td>
                          <td className="cell-prob">
                            <div className="prob-cell">
                              <span className="prob-pct font-mono">
                                {Number(record.probability_percent).toFixed(1)}%
                              </span>
                              <div className="table-progress-bar">
                                <div
                                  className={`table-progress-fill ${
                                    record.probability_percent >= 70
                                      ? 'fill-red'
                                      : record.probability_percent >= 40
                                      ? 'fill-amber'
                                      : 'fill-green'
                                  }`}
                                  style={{ width: `${record.probability_percent}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="cell-tier">
                            <span className={`tier-badge tier-${riskKey}`}>
                              {record.risk_level}
                            </span>
                          </td>
                          <td className="cell-score font-mono">{record.credit_score}</td>
                          <td className="cell-country">{record.country}</td>
                          <td className="cell-profile">
                            {record.age}y • {record.gender}
                          </td>
                          <td className="cell-prod">{record.products_number}</td>
                          <td className="cell-balance font-mono">${Number(record.balance).toLocaleString()}</td>
                          <td className="cell-active">
                            <span
                              className={`status-dot ${record.active_member === 1 ? 'green' : 'gray'}`}
                              title={record.active_member === 1 ? 'Active' : 'Inactive'}
                            ></span>
                            {record.active_member === 1 ? 'Active' : 'Inactive'}
                          </td>
                          <td className={`cell-action-col ${strategyViewMode === 'compact' ? 'cell-compact' : 'cell-expanded'}`}>
                            {strategyViewMode === 'compact' ? (
                              <button
                                type="button"
                                className={`strategy-action-badge badge-${riskKey}`}
                                onClick={() => setSelectedPlaybookRecord(record)}
                                title={`${parsed.tag}: ${parsed.details} (Click to open retention playbook)`}
                              >
                                <span className="badge-left-group">
                                  <span className="pulse-dot"></span>
                                  <span className="badge-text">{parsed.tag}</span>
                                </span>
                                <span className="badge-action-sign" aria-hidden="true">
                                  <ChevronRight size={13} />
                                </span>
                              </button>
                            ) : (
                              <div className={`action-strategy-pill action-${riskKey}`}>
                                {renderStrategy(record.recommendation, record.risk_level)}
                                <button
                                  type="button"
                                  className="expanded-playbook-trigger"
                                  onClick={() => setSelectedPlaybookRecord(record)}
                                >
                                  <Sparkles size={12} />
                                  <span>Open Retention Playbook</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="table-empty">
                        No customer records matched the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalFiltered > 0 && (
              <div className="table-pagination-bar">
                <div className="pagination-info">
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
                  <strong>{totalFiltered.toLocaleString()}</strong> customers
                </div>

                <div className="pagination-actions">
                  <div className="page-size-selector">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                        setPageSize(val);
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="ALL">All ({totalFiltered.toLocaleString()})</option>
                    </select>
                  </div>

                  {!isAll && totalPages > 1 && (
                    <div className="pagination-numbers-list">
                      <button
                        type="button"
                        className="page-nav-btn text-nav-btn"
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        title="Previous Page"
                      >
                        <ChevronLeft size={16} />
                        <span>Prev</span>
                      </button>

                      {getPageNumbers().map((item, idx) =>
                        item === '...' ? (
                          <span key={`dots-${idx}`} className="page-ellipsis">
                            ...
                          </span>
                        ) : (
                          <button
                            key={`page-${item}`}
                            type="button"
                            className={`page-num-btn ${safeCurrentPage === item ? 'active' : ''}`}
                            onClick={() => setCurrentPage(item)}
                          >
                            {item}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className="page-nav-btn text-nav-btn"
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        title="Next Page"
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Customer Retention Playbook Modal */}
      {selectedPlaybookRecord && (
        <div
          className="playbook-modal-backdrop"
          onClick={() => setSelectedPlaybookRecord(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="playbook-modal-title"
        >
          <div
            className={`playbook-modal-card modal-risk-${(
              selectedPlaybookRecord.risk_level || 'low'
            ).toLowerCase()}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="playbook-modal-header">
              <div className="playbook-title-wrap">
                <div
                  className={`playbook-icon-box box-${(
                    selectedPlaybookRecord.risk_level || 'low'
                  ).toLowerCase()}`}
                >
                  {selectedPlaybookRecord.risk_level === 'High' ? (
                    <ShieldAlert size={22} />
                  ) : selectedPlaybookRecord.risk_level === 'Medium' ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <ShieldCheck size={22} />
                  )}
                </div>
                <div>
                  <h3 id="playbook-modal-title" className="playbook-title">
                    Customer Retention Playbook
                  </h3>
                  <div className="playbook-subtitle">
                    Account: <span className="font-mono">{selectedPlaybookRecord.customer_id || `ID-${selectedPlaybookRecord.row_index}`}</span> • Row #{selectedPlaybookRecord.row_index}
                  </div>
                </div>
              </div>

              <div className="playbook-header-actions">
                <span
                  className={`tier-badge tier-${(
                    selectedPlaybookRecord.risk_level || 'low'
                  ).toLowerCase()}`}
                >
                  {selectedPlaybookRecord.risk_level} Risk
                </span>
                <button
                  type="button"
                  className="playbook-close-btn"
                  onClick={() => setSelectedPlaybookRecord(null)}
                  title="Close Playbook (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="playbook-modal-body">
              {/* Urgency Highlight Banner */}
              <div
                className={`playbook-urgency-banner banner-${(
                  selectedPlaybookRecord.risk_level || 'low'
                ).toLowerCase()}`}
              >
                <div className="urgency-banner-left">
                  <span className="pulse-dot large"></span>
                  <strong>
                    {parseStrategy(selectedPlaybookRecord.recommendation, selectedPlaybookRecord.risk_level).tag}
                  </strong>
                </div>
                <div className="urgency-banner-right font-mono">
                  {Number(selectedPlaybookRecord.probability_percent).toFixed(1)}% Churn Probability
                </div>
              </div>

              {/* Customer Snapshot Grid */}
              <div className="playbook-snapshot-grid">
                <div className="snapshot-card">
                  <span className="snapshot-label">Verdict</span>
                  <span
                    className={`snapshot-value badge-pill ${
                      selectedPlaybookRecord.churn === 1 ? 'badge-danger' : 'badge-success'
                    }`}
                  >
                    {selectedPlaybookRecord.label}
                  </span>
                </div>
                <div className="snapshot-card">
                  <span className="snapshot-label">Account Balance</span>
                  <span className="snapshot-value font-mono">
                    ${Number(selectedPlaybookRecord.balance).toLocaleString()}
                  </span>
                </div>
                <div className="snapshot-card">
                  <span className="snapshot-label">Credit Score</span>
                  <span className="snapshot-value font-mono">
                    {selectedPlaybookRecord.credit_score}
                  </span>
                </div>
                <div className="snapshot-card">
                  <span className="snapshot-label">Products & Active</span>
                  <span className="snapshot-value">
                    {selectedPlaybookRecord.products_number} prod • {selectedPlaybookRecord.active_member === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="snapshot-card">
                  <span className="snapshot-label">Demographics</span>
                  <span className="snapshot-value">
                    {selectedPlaybookRecord.age}y • {selectedPlaybookRecord.gender} • {selectedPlaybookRecord.country}
                  </span>
                </div>
                <div className="snapshot-card">
                  <span className="snapshot-label">Tenure & Est. Salary</span>
                  <span className="snapshot-value font-mono">
                    {selectedPlaybookRecord.tenure}y • ${Number(selectedPlaybookRecord.estimated_salary).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Core Recommended Strategy Callout */}
              <div className="playbook-strategy-section">
                <div className="playbook-section-label">
                  <Sparkles size={14} />
                  <span>Strategic Retention Directive</span>
                </div>
                <div
                  className={`playbook-strategy-box box-${(
                    selectedPlaybookRecord.risk_level || 'low'
                  ).toLowerCase()}`}
                >
                  <p className="playbook-strategy-text">
                    {parseStrategy(selectedPlaybookRecord.recommendation, selectedPlaybookRecord.risk_level).details}
                  </p>
                </div>
              </div>

              {/* Suggested Retention Action Steps Checklist */}
              <div className="playbook-checklist-section">
                <div className="playbook-section-label">
                  <span>Recommended Strategy Execution Steps</span>
                </div>
                <div className="playbook-steps-list">
                  {getPlaybookChecklist(selectedPlaybookRecord.risk_level).map((stepItem) => (
                    <div key={stepItem.step} className="playbook-step-card">
                      <div className="step-number">{stepItem.step}</div>
                      <div className="step-content">
                        <div className="step-title">{stepItem.title}</div>
                        <div className="step-desc">{stepItem.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="playbook-modal-footer">
              <div className="playbook-nav-controls">
                <button
                  type="button"
                  className="modal-nav-btn"
                  onClick={() => handleModalNav('prev')}
                  title="Previous customer in current view"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="modal-nav-btn"
                  onClick={() => handleModalNav('next')}
                  title="Next customer in current view"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="playbook-footer-actions">
                <button
                  type="button"
                  className="copy-memo-btn"
                  onClick={() => copyPlaybookMemo(selectedPlaybookRecord)}
                >
                  {copiedMemo ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedMemo ? 'Copied Memo!' : 'Copy Retention Memo'}</span>
                </button>
                <button
                  type="button"
                  className="modal-close-primary-btn"
                  onClick={() => setSelectedPlaybookRecord(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


