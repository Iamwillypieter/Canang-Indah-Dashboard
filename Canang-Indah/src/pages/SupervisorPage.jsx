import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./SupervisorPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/* ================= FORM REGISTRY ================= */
const FORM_TYPES = {
  qc: {
    label: "QC Analisa",
    icon: "🧪",
    route: "/view/qc",
    endpoint: `${API_BASE}/qc-analisa-documents`
  },
  resin: {
    label: "Resin Inspection",
    icon: "🧴",
    route: "/view/resin",  
    endpoint: `${API_BASE}/resin-inspection-documents`
  },
  flakes: {
    label: "Flakes Inspection",
    icon: "🪵",
    route: "/view/flakes", 
    endpoint: `${API_BASE}/flakes-documents`
  },
  labPBForm: {
    label: "Lab PB Form",
    icon: "🏭",
    route: "/view/lab-pb", 
    endpoint: `${API_BASE}/lab-pb-documents`
  }
};

export default function SupervisorPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // ✅ DATE FILTER STATE
  const [viewMode, setViewMode] = useState("list");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  
  // ✅ NEW: Auto-set today's date on mount (optional but user-friendly)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDateFilter(today); // Uncomment to auto-set today: setDateFilter(today);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchWithAuth = async (url) => {
    const token = getAuthToken();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    return response;
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const requests = Object.entries(FORM_TYPES).map(
        async ([key, config]) => {
          const res = await fetchWithAuth(config.endpoint);
          
          if (!res.ok) {
            console.warn(`Failed to fetch ${config.label}`);
            return [];
          }

          const data = await res.json();

          const docsArray = Array.isArray(data)
            ? data
            : data.documents || [];

          return docsArray.map(doc => ({
            ...doc,
            type: key,
            parsed_shift: extractShift(doc.board_no || doc.shift_group || doc.shift || ''),
            parsed_doc_number: extractDocNumber(doc.board_no || doc.title || '')
          }));
        }
      );

      const results = await Promise.all(requests);

      const mergedDocs = results
        .flat()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setDocuments(mergedDocs);
    } catch (err) {
      console.error("❌ FETCH SUPERVISOR ERROR:", err);
      alert("❌ Gagal memuat data dokumen: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNGSI BARU: Extract shift dari board_no
  const extractShift = (str) => {
    if (!str) return '';
    const match = str.match(/\b([1-3][A-D])\b/i);
    return match ? match[1].toUpperCase() : '';
  };

  // 🔥 FUNGSI BARU: Extract doc number dari board_no
  const extractDocNumber = (str) => {
    if (!str) return '';
    const match = str.match(/\b(\d{4})\b/);
    return match ? match[1] : '';
  };

  // ✅ NEW: Base filtered documents (applies BOTH date and search filters)
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Apply DATE FILTER first (more efficient)
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter(doc => {
        const docDate = new Date(doc.created_at);
        return (
          docDate.getFullYear() === filterDate.getFullYear() &&
          docDate.getMonth() === filterDate.getMonth() &&
          docDate.getDate() === filterDate.getDate()
        );
      });
    }

    // Apply SEARCH FILTER
    if (search.trim()) {
      const terms = search.toLowerCase().trim().split(/\s+/);
      result = result.filter(doc => {
        const searchFields = [
          doc.parsed_shift,
          doc.parsed_doc_number,
          doc.board_no,
          doc.shift_group,
          doc.shift,
          doc.title,
          doc.type,
          doc.material,
          doc.keterangan,
          doc.operator,
          doc.jam,
          doc.tanggal
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        
        return terms.some(term => searchFields.includes(term));
      });
    }

    return result;
  }, [documents, dateFilter, search]);

  // 🔥 GROUPING LOGIC: Now uses filteredDocuments (respects date + search)
  const groupedDocuments = useMemo(() => {
    const groups = {};
    
    filteredDocuments.forEach(doc => {
      const shift = doc.parsed_shift || doc.shift_group || doc.shift || 'Unknown';
      const docNum = doc.parsed_doc_number || extractDocNumber(doc.board_no) || 'Unknown';
      const groupKey = `${shift}-${docNum}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          shift,
          doc_number: docNum,
          documents: [],
          test_count: 0
        };
      }
      
      groups[groupKey].documents.push(doc);
      groups[groupKey].test_count++;
    });

    return Object.values(groups).sort((a, b) => {
      if (a.shift !== b.shift) return a.shift.localeCompare(b.shift);
      return a.doc_number.localeCompare(b.doc_number);
    });
  }, [filteredDocuments]);

  const toggleSelectForCompare = (doc) => {
    setSelectedForCompare(prev => {
      const exists = prev.find(d => d.id === doc.id && d.type === doc.type);

      if (exists) {
        return prev.filter(d => !(d.id === doc.id && d.type === doc.type));
      }

      // ✅ RULE BARU
      if (prev.length > 0) {
        const first = prev[0];

        if (first.type !== doc.type) {
          alert("⚠ Compare hanya boleh dokumen sejenis");
          return prev;
        }

        if (first.board_no !== doc.board_no) {
          alert("⚠ Compare hanya untuk Board No yang sama");
          return prev;
        }
      }

      if (prev.length >= 4) {
        alert("Maksimal 4 dokumen");
        return prev;
      }

      return [...prev, doc];
    });
  };


  const clearSelection = () => {
    setSelectedForCompare([]);
    setComparisonMode(false);
  };

  const selectGroupForCompare = (group) => {
    if (group.documents.length > 4) {
      alert("Grup ini memiliki lebih dari 4 dokumen, hanya 4 pertama yang dipilih");
    }
    setSelectedForCompare(group.documents.slice(0, 4));
    setComparisonMode(true);
  };

  // ✅ NEW: Clear date filter
  const clearDateFilter = () => {
    setDateFilter("");
    // Optional: Auto-focus search after clearing date
    setTimeout(() => document.querySelector('.search-input')?.focus(), 0);
  };

  const documentsByType = useMemo(() => {
    const groups = {};

    filteredDocuments.forEach(doc => {
      if (!groups[doc.type]) {
        groups[doc.type] = [];
      }
      groups[doc.type].push(doc);
    });

    return groups;
  }, [filteredDocuments]);

  const groupedByType = useMemo(() => {
    const typeGroups = {};

    filteredDocuments.forEach(doc => {
      if (!typeGroups[doc.type]) {
        typeGroups[doc.type] = {};
      }

      const shift = doc.parsed_shift || doc.shift_group || doc.shift || "Unknown";
      const docNum = doc.parsed_doc_number || extractDocNumber(doc.board_no) || "Unknown";
      const groupKey = `${shift}-${docNum}`;

      if (!typeGroups[doc.type][groupKey]) {
        typeGroups[doc.type][groupKey] = {
          shift,
          doc_number: docNum,
          documents: [],
          test_count: 0
        };
      }

      typeGroups[doc.type][groupKey].documents.push(doc);
      typeGroups[doc.type][groupKey].test_count++;
    });

    return typeGroups;
  }, [filteredDocuments]);



  return (
    <div className="supervisor-container">
      <header className="supervisor-header">
        <h1>📋 Supervisor Document Review</h1>
        <p className="supervisor-subtitle">View dan compare semua dokumen laboratory</p>
      </header>

      {/* 🔥 ENHANCED TOOLBAR WITH DATE FILTER */}
      <div className="filter-toolbar">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="🔍 Search Document"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
              aria-label="Cari dokumen"
            />
            <span className="search-count">
              {viewMode === 'list' 
                ? `${filteredDocuments.length} dokumen` 
                : `${groupedDocuments.length} grup`}
            </span>
          </div>
          
          {search && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* ✅ DATE FILTER SECTION - New prominent date picker */}
        <div className="date-filter-container">
          <div className="date-input-wrapper">
            <input
              type="date"
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-filter-input"
              aria-label="Pilih tanggal"
            />
            {dateFilter && (
              <button 
                className="clear-date-btn" 
                onClick={clearDateFilter}
                title="Clear date filter"
                aria-label="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* View Toggle & Actions */}
        <div className="toolbar-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              📄 List
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`}
              onClick={() => setViewMode('grouped')}
              aria-pressed={viewMode === 'grouped'}
            >
              📊 Group
            </button>
          </div>

          <button 
            onClick={fetchDocuments} 
            className="refresh-btn"
            title="Refresh data"
            aria-label="Refresh data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Comparison Mode Toggle */}
      {documents.length > 0 && (
        <div className="comparison-toggle">
          <label className="switch">
            <input 
              type="checkbox" 
              checked={comparisonMode}
              onChange={(e) => {
                setComparisonMode(e.target.checked);
                if (!e.target.checked) setSelectedForCompare([]);
              }}
              aria-label="Toggle comparison mode"
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">
            {comparisonMode ? "✅ Mode Comparison Aktif" : "Mode Comparison"}
          </span>
          {comparisonMode && selectedForCompare.length > 0 && (
            <button 
              onClick={clearSelection}
              className="clear-selection-btn"
              aria-label={`Clear ${selectedForCompare.length} selected items`}
            >
              Clear Selection ({selectedForCompare.length})
            </button>
          )}
        </div>
      )}

      {/* 🔥 GROUPED VIEW - Now uses filteredDocuments */}
      {viewMode === "grouped" && (
        <div className="grouped-section">
          <div className="view-header">
            <h3>📊 Dokumen Ter-group by Shift & Nomor Dokumen</h3>
          </div>

          {Object.keys(groupedByType).length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>Tidak ada dokumen</p>
            </div>
          ) : (
            Object.entries(groupedByType).map(([type, groups]) => {
              const config = FORM_TYPES[type];

              const sortedGroups = Object.values(groups).sort((a, b) => {
                if (a.shift !== b.shift) return a.shift.localeCompare(b.shift);
                return a.doc_number.localeCompare(b.doc_number);
              });

              return (
                <div key={type} className="doc-type-section">
                  <h3 className="type-section-title">
                    {config.icon} {config.label}
                    <span className="type-count">({sortedGroups.length} grup)</span>
                  </h3>

                  {sortedGroups.map(group => (
                    <div
                      key={`${type}-${group.shift}-${group.doc_number}`}
                      className="shift-group-card"
                    >
                      <div className="shift-group-header">
                        <div className="group-title">
                          <h4>
                            🔄 Shift {group.shift} | 📄 No. {group.doc_number}
                          </h4>
                          <span className="test-count-badge">
                            {group.test_count} Test
                          </span>
                        </div>

                        <div className="group-actions">
                          <button
                            className="btn-select-group"
                            onClick={() => selectGroupForCompare(group)}
                          >
                            ⚖️ Compare
                          </button>
                        </div>
                      </div>

                      <div className="grouped-docs-grid">
                        {group.documents.map((doc, index) => {
                          const isSelected = selectedForCompare.some(
                            d => d.id === doc.id && d.type === doc.type
                          );

                          return (
                            <div
                              key={`${doc.type}-${doc.id}`}
                              className={`test-doc-card ${isSelected ? "selected" : ""}`}
                              onClick={
                                comparisonMode
                                  ? () => toggleSelectForCompare(doc)
                                  : () => setSelectedDoc(doc)
                              }
                            >
                              <div className="test-number-badge">
                                Test {index + 1}
                              </div>

                              <h3 className="doc-title">
                                {doc.title || config.label}
                              </h3>

                              <div className="doc-meta-compact">
                                <p>
                                  🕒{" "}
                                  {new Date(doc.created_at).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </p>

                                {doc.board_no && (
                                  <p>🏷️ {doc.board_no}</p>
                                )}
                              </div>

                              {!comparisonMode && (
                                <Link
                                  to={`${config.route}/${doc.id}`}
                                  className="btn-view-doc"
                                  onClick={e => e.stopPropagation()}
                                >
                                  👁️ View
                                </Link>
                              )}

                              {comparisonMode && (
                                <div className="selection-indicator">
                                  {isSelected ? "✅ Terpilih" : "Klik untuk pilih"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}


      {/* LIST VIEW - Uses filteredDocuments */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>⏳ Loading data dokumen...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>
                {dateFilter && search ? 
                  `Tidak ada dokumen pada tanggal ${new Date(dateFilter).toLocaleDateString("id-ID")} yang sesuai "${search}"` :
                dateFilter ? 
                  `Tidak ada dokumen pada tanggal ${new Date(dateFilter).toLocaleDateString("id-ID")}` :
                search ? 
                  `Tidak ada dokumen yang sesuai "${search}"` :
                  "Belum ada dokumen tersedia"}
              </p>
              {(dateFilter || search) && (
                <div className="filter-hint">
                  <button 
                    onClick={() => { setDateFilter(""); setSearch(""); }} 
                    className="refresh-btn-small"
                  >
                    🔄 Reset Filter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="doc-type-sections">
              {Object.entries(documentsByType).map(([type, docs]) => {
                const config = FORM_TYPES[type];

                return (
                  <div key={type} className="doc-type-section">
                    <h3 className="type-section-title">
                      {config.icon} {config.label}
                      <span className="type-count">({docs.length})</span>
                    </h3>

                    <div className="doc-grid">
                      {docs.map(doc => {
                        const isSelected = selectedForCompare.some(
                          d => d.id === doc.id && d.type === doc.type
                        );

                        return (
                          <div
                            key={`${doc.type}-${doc.id}`}
                            className={`doc-card ${comparisonMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={
                              comparisonMode
                                ? () => toggleSelectForCompare(doc)
                                : () => setSelectedDoc(doc)
                            }
                          >
                            <div className="doc-card-header">
                              <div className="doc-type-info">
                                <span className="doc-icon">{config.icon}</span>
                                <span className="doc-type-badge">
                                  {config.label}
                                </span>
                              </div>

                              <span className={`status-badge status-${doc.status?.toLowerCase() || 'completed'}`}>
                                {doc.status || 'Completed'}
                              </span>
                            </div>

                            <h3 className="doc-title">
                              {doc.title || `Dokumen ${config.label}`}
                            </h3>

                            <div className="doc-meta">
                              <p className="doc-date">
                                📅{" "}
                                {new Date(doc.created_at).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric"
                                })}{" "}
                                |{" "}
                                {new Date(doc.created_at).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>

                              {doc.board_no && (
                                <p className="doc-board-no">
                                  🏷️ {doc.board_no}
                                </p>
                              )}

                              {(doc.parsed_shift || doc.shift_group) && (
                                <p className="doc-shift">
                                  🔄 {doc.parsed_shift || doc.shift_group}
                                </p>
                              )}
                            </div>

                            {!comparisonMode && (
                              <Link
                                to={`${config.route}/${doc.id}`}
                                className="btn-view-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                👁️ View Full Document
                              </Link>
                            )}

                            {comparisonMode && (
                              <div className="selection-indicator">
                                {isSelected ? "✅ Terpilih" : "Klik untuk pilih"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Comparison Modal - Sama seperti sebelumnya */}
      {selectedForCompare.length > 1 && (
        <div className="comparison-modal-overlay" onClick={clearSelection}>
          <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comparison-modal-header">
              <h2>📊 Comparison View - {selectedForCompare.length} Dokumen</h2>
              <button className="btn-close-modal" onClick={clearSelection}>✕</button>
            </div>

            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {selectedForCompare.map((doc, idx) => {
                      const config = FORM_TYPES[doc.type] || FORM_TYPES.flakes;
                      return (
                        <th key={idx}>
                          <div className="comparison-header">
                            <span className="doc-icon">{config.icon}</span>
                            <div>
                              <div className="comparison-title">{doc.title || config.label}</div>
                              <div className="comparison-meta">
                                {doc.board_no && <span>Board: {doc.board_no}</span>}
                                {(doc.parsed_shift || doc.shift_group) && (
                                  <span>Shift: {doc.parsed_shift || doc.shift_group}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const importantFields = [
                      "density_avg",
                      "moisture_avg",
                      "thickness_avg",
                      "ib_avg",
                      "mor_avg",
                      "swelling_avg"
                    ];

                    return importantFields.map(field => (
                      <tr key={field}>
                        <td><strong>{field.replace("_", " ").toUpperCase()}</strong></td>
                        {selectedForCompare.map((doc, idx) => (
                          <td key={idx}>
                            {doc[field] ?? "-"}
                          </td>
                        ))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="comparison-modal-footer">
              <button className="btn-secondary" onClick={clearSelection}>
                Tutup Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Sama seperti sebelumnya */}
      {selectedDoc && !comparisonMode && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Detail Dokumen (Preview)</h2>
              <button
                className="btn-close-modal"
                onClick={() => setSelectedDoc(null)}
                title="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {(() => {
                const config = FORM_TYPES[selectedDoc.type] || FORM_TYPES.flakes;
                
                return (
                  <>
                    <div className="modal-detail">
                      <div className="detail-row">
                        <label>📌 Judul Dokumen</label>
                        <span>{selectedDoc.title || config.label}</span>
                      </div>

                      <div className="detail-row">
                        <label>🏭 Tipe Dokumen</label>
                        <div className="doc-type-display">
                          <span className="doc-icon-large">{config.icon}</span>
                          <span>{config.label}</span>
                        </div>
                      </div>

                      {/* 🔥 TAMBAHAN: Info Parsed */}
                      {(selectedDoc.parsed_shift || selectedDoc.parsed_doc_number) && (
                        <div className="detail-row highlight">
                          <label>🎯 Parsed Info</label>
                          <div className="parsed-info">
                            {selectedDoc.parsed_shift && (
                              <span className="parsed-badge">Shift: {selectedDoc.parsed_shift}</span>
                            )}
                            {selectedDoc.parsed_doc_number && (
                              <span className="parsed-badge">No: {selectedDoc.parsed_doc_number}</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="detail-row">
                        <label>📊 Status</label>
                        <span className={`status-badge status-${selectedDoc.status?.toLowerCase() || 'completed'}`}>
                          {selectedDoc.status || 'Completed'}
                        </span>
                      </div>

                      <div className="detail-row">
                        <label>📅 Dibuat pada</label>
                        <span>
                          {new Date(selectedDoc.created_at).toLocaleString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </span>
                      </div>

                      {selectedDoc.updated_at && (
                        <div className="detail-row">
                          <label>✏️ Terakhir diupdate</label>
                          <span>
                            {new Date(selectedDoc.updated_at).toLocaleString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      )}

                      {selectedDoc.board_no && (
                        <div className="detail-row">
                          <label>🏷️ Board No</label>
                          <span>{selectedDoc.board_no}</span>
                        </div>
                      )}

                      {(selectedDoc.parsed_shift || selectedDoc.shift_group) && (
                        <div className="detail-row">
                          <label>🔄 Shift Group</label>
                          <span>{selectedDoc.parsed_shift || selectedDoc.shift_group}</span>
                        </div>
                      )}

                      {selectedDoc.operator && (
                        <div className="detail-row">
                          <label>👤 Operator</label>
                          <span>{selectedDoc.operator}</span>
                        </div>
                      )}

                      {Object.entries(selectedDoc).map(([key, value]) => {
                        const skipFields = [
                          'id', 'title', 'type', 'status', 
                          'created_at', 'updated_at', 'documents',
                          'operator', 'shift', 'shift_group', 'board_no',
                          '_id', '__v', 'parsed_shift', 'parsed_doc_number'
                        ];
                        
                        if (skipFields.includes(key)) return null;
                        if (value === null || value === undefined) return null;
                        if (Array.isArray(value) && value.length === 0) return null;
                        if (typeof value === 'object' && Object.keys(value).length === 0) return null;

                        const formatKey = (k) => {
                          return k
                            .replace(/_/g, ' ')
                            .replace(/-/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase());
                        };

                        return (
                          <div className="detail-row" key={key}>
                            <label>{formatKey(key)}</label>
                            <span className="detail-value">
                              {typeof value === 'object' 
                                ? JSON.stringify(value, null, 2) 
                                : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedDoc(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}