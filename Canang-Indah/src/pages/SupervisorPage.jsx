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
  const [dateFilter, setDateFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    // setDateFilter(today); // Uncomment to auto-set today
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getAuthToken = () => localStorage.getItem('token');

  const fetchWithAuth = async (url) => {
    const token = getAuthToken();
    return fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
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
          const docsArray = Array.isArray(data) ? data : data.documents || [];

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

  const extractShift = (str) => {
    if (!str) return '';
    const match = str.match(/\b([1-3][A-D])\b/i);
    return match ? match[1].toUpperCase() : '';
  };

  const extractDocNumber = (str) => {
    if (!str) return '';
    const match = str.match(/\b(\d{4})\b/);
    return match ? match[1] : '';
  };

  // 👇 HELPER: Ambil judul dokumen (prioritaskan tag_name)
  const getDocumentTitle = (doc) => {
    const rawTag = doc.tag_name || doc.tagName || doc.tagname;
    if (rawTag?.trim()) return rawTag.trim();
    if (doc.title?.trim()) return doc.title.trim();
    if (doc.document_title?.trim()) return doc.document_title.trim();
    return `${FORM_TYPES[doc.type]?.label || "Dokumen"} #${doc.id}`;
  };

  // 👇 HELPER: Ambil detail header untuk ditampilkan
  const getHeaderDetails = (doc) => {
    const details = [];
    
    // 📅 Tanggal
    const dateVal = doc.tanggal || doc.date;
    if (dateVal) {
      const formatted = new Date(dateVal).toLocaleDateString("id-ID", {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      details.push({ label: "Tanggal", value: formatted });
    }
    
    // 🔄 Shift
    const shiftVal = doc.shift || doc.shift_group || doc.shiftGroup;
    if (shiftVal) {
      details.push({ label: "Shift", value: shiftVal });
    }
    
    // 👥 Group
    const groupVal = doc.group || doc.group_name || doc.groupName;
    if (groupVal) {
      details.push({ label: "Group", value: groupVal });
    }
    
    // ⏰ Jam
    if (doc.jam || doc.time) {
      details.push({ label: "Jam", value: doc.jam || doc.time });
    }
    
    // 🪵 Board/Lot No
    const boardVal = doc.board_no || doc.boardNo || doc.lot_no || doc.batch_no;
    if (boardVal) {
      details.push({ label: "Board/Lot", value: boardVal });
    }
    
    // 📏 Ukuran Papan (Flakes)
    if (doc.ukuranPapan || doc.ukuran_papan) {
      details.push({ label: "Ukuran", value: doc.ukuranPapan || doc.ukuran_papan });
    }

    // 🧴 RESIN SPECIFIC
    if (doc.type === "resin") {
      const inspection = doc.inspection?.[0] || {};
      if (inspection.resinTank) details.push({ label: "Resin Tank", value: inspection.resinTank });
      if (inspection.certTestNo) details.push({ label: "Cert No", value: inspection.certTestNo });
      if (inspection.quantity) details.push({ label: "Quantity", value: inspection.quantity });
      if (doc.comment_by) details.push({ label: "Comment By", value: doc.comment_by });
    }

    return details;
  };

  // ✅ Base filtered documents (applies BOTH date and search filters)
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Apply DATE FILTER
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

    // Apply SEARCH FILTER (include tag_name)
    if (search.trim()) {
      const terms = search.toLowerCase().trim().split(/\s+/);
      result = result.filter(doc => {
        const rawTag = (doc.tag_name || doc.tagName || doc.tagname || "").toLowerCase();
        const searchFields = [
          rawTag,  // 👈 Tambahkan tag_name di search
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
          doc.tanggal,
          doc.group,
          doc.group_name
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        
        return terms.some(term => searchFields.includes(term));
      });
    }

    return result;
  }, [documents, dateFilter, search]);

  // 🔥 GROUPING LOGIC
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
      if (exists) return prev.filter(d => !(d.id === doc.id && d.type === doc.type));

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

  const clearDateFilter = () => {
    setDateFilter("");
    setTimeout(() => document.querySelector('.search-input')?.focus(), 0);
  };

  const documentsByType = useMemo(() => {
    const groups = {};
    filteredDocuments.forEach(doc => {
      if (!groups[doc.type]) groups[doc.type] = [];
      groups[doc.type].push(doc);
    });
    return groups;
  }, [filteredDocuments]);

  const groupedByType = useMemo(() => {
    const typeGroups = {};
    filteredDocuments.forEach(doc => {
      if (!typeGroups[doc.type]) typeGroups[doc.type] = {};
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

      {/* 🔥 TOOLBAR */}
      <div className="filter-toolbar">
        <div className="search-section">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="🔍 Search by Tag Name, Shift, Date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <span className="search-count">
              {viewMode === 'list' 
                ? `${filteredDocuments.length} dokumen` 
                : `${groupedDocuments.length} grup`}
            </span>
          </div>
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div className="date-filter-container">
          <div className="date-input-wrapper">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-filter-input"
            />
            {dateFilter && (
              <button className="clear-date-btn" onClick={clearDateFilter}>✕</button>
            )}
          </div>
        </div>

        <div className="toolbar-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📄 List
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`}
              onClick={() => setViewMode('grouped')}
            >
              📊 Group
            </button>
          </div>
          <button onClick={fetchDocuments} className="refresh-btn">🔄 Refresh</button>
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
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">
            {comparisonMode ? "✅ Mode Comparison Aktif" : "Mode Comparison"}
          </span>
          {comparisonMode && selectedForCompare.length > 0 && (
            <button onClick={clearSelection} className="clear-selection-btn">
              Clear ({selectedForCompare.length})
            </button>
          )}
        </div>
      )}

      {/* 🔥 GROUPED VIEW */}
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
                    <div key={`${type}-${group.shift}-${group.doc_number}`} className="shift-group-card">
                      <div className="shift-group-header">
                        <div className="group-title">
                          <h4>🔄 Shift {group.shift} | 📄 No. {group.doc_number}</h4>
                          <span className="test-count-badge">{group.test_count} Test</span>
                        </div>
                        <div className="group-actions">
                          <button className="btn-select-group" onClick={() => selectGroupForCompare(group)}>
                            ⚖️ Compare
                          </button>
                        </div>
                      </div>

                      <div className="grouped-docs-grid">
                        {group.documents.map((doc, index) => {
                          const isSelected = selectedForCompare.some(d => d.id === doc.id && d.type === doc.type);
                          const docTitle = getDocumentTitle(doc);
                          const headerDetails = getHeaderDetails(doc);
                          const rawTagName = doc.tag_name || doc.tagName || doc.tagname;
                          const hasTagName = !!(rawTagName?.trim());

                          return (
                            <div
                              key={`${doc.type}-${doc.id}`}
                              className={`test-doc-card ${isSelected ? "selected" : ""}`}
                              onClick={comparisonMode ? () => toggleSelectForCompare(doc) : () => setSelectedDoc(doc)}
                            >
                              <div className="test-number-badge">Test {index + 1}</div>

                              {/* 👑 TAG NAME BADGE */}
                              <div className="doc-title-wrapper">
                                {hasTagName && (
                                  <span className="tag-name-badge">🏷️ {docTitle}</span>
                                )}
                                {!hasTagName && (
                                  <span className="doc-title-default">{docTitle}</span>
                                )}
                              </div>

                              {/* 📋 HEADER DETAILS */}
                              {headerDetails.length > 0 && (
                                <div className="doc-header-details">
                                  {headerDetails.slice(0, 3).map((detail, idx) => (
                                    <span key={idx} className="detail-item">
                                      <strong>{detail.label}:</strong> {detail.value}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="doc-meta-compact">
                                <p>🕒 {new Date(doc.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                                {doc.board_no && <p>🏷️ {doc.board_no}</p>}
                              </div>

                              {!comparisonMode && (
                                <Link to={`${config.route}/${doc.id}`} className="btn-view-doc" onClick={e => e.stopPropagation()}>
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

      {/* 🔥 LIST VIEW */}
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
                <button onClick={() => { setDateFilter(""); setSearch(""); }} className="refresh-btn-small">
                  🔄 Reset Filter
                </button>
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
                        const isSelected = selectedForCompare.some(d => d.id === doc.id && d.type === doc.type);
                        const docTitle = getDocumentTitle(doc);
                        const headerDetails = getHeaderDetails(doc);
                        const rawTagName = doc.tag_name || doc.tagName || doc.tagname;
                        const hasTagName = !!(rawTagName?.trim());

                        return (
                          <div
                            key={`${doc.type}-${doc.id}`}
                            className={`doc-card ${comparisonMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={comparisonMode ? () => toggleSelectForCompare(doc) : () => setSelectedDoc(doc)}
                          >
                            <div className="doc-card-header">
                              <div className="doc-type-info">
                                <span className="doc-icon">{config.icon}</span>
                                <span className="doc-type-badge">{config.label}</span>
                              </div>
                              <span className={`status-badge status-${doc.status?.toLowerCase() || 'completed'}`}>
                                {doc.status || 'Completed'}
                              </span>
                            </div>

                            {/* 👑 TAG NAME BADGE */}
                            <div className="doc-title-wrapper">
                              {hasTagName && (
                                <span className="tag-name-badge">🏷️ {docTitle}</span>
                              )}
                              {!hasTagName && (
                                <span className="doc-title-default">{docTitle}</span>
                              )}
                            </div>

                            {/* 📋 HEADER DETAILS */}
                            {headerDetails.length > 0 && (
                              <div className="doc-header-details">
                                {headerDetails.slice(0, 3).map((detail, idx) => (
                                  <span key={idx} className="detail-item">
                                    <strong>{detail.label}:</strong> {detail.value}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="doc-meta">
                              <p className="doc-date">
                                📅 {new Date(doc.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                              </p>
                              {doc.board_no && <p className="doc-board-no">🏷️ {doc.board_no}</p>}
                              {(doc.parsed_shift || doc.shift_group) && (
                                <p className="doc-shift">🔄 {doc.parsed_shift || doc.shift_group}</p>
                              )}
                            </div>

                            {!comparisonMode && (
                              <Link to={`${config.route}/${doc.id}`} className="btn-view-full" onClick={(e) => e.stopPropagation()}>
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

      {/* Comparison Modal - (sama seperti sebelumnya, bisa dipertahankan) */}
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
                              <div className="comparison-title">{getDocumentTitle(doc)}</div>
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
                  {["density_avg", "moisture_avg", "thickness_avg", "ib_avg", "mor_avg", "swelling_avg"].map(field => (
                    <tr key={field}>
                      <td><strong>{field.replace("_", " ").toUpperCase()}</strong></td>
                      {selectedForCompare.map((doc, idx) => (
                        <td key={idx}>{doc[field] ?? "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="comparison-modal-footer">
              <button className="btn-secondary" onClick={clearSelection}>Tutup Comparison</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - (sama seperti sebelumnya) */}
      {selectedDoc && !comparisonMode && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Detail Dokumen (Preview)</h2>
              <button className="btn-close-modal" onClick={() => setSelectedDoc(null)}>✕</button>
            </div>
            <div className="modal-body">
              {(() => {
                const config = FORM_TYPES[selectedDoc.type] || FORM_TYPES.flakes;
                const docTitle = getDocumentTitle(selectedDoc);
                const headerDetails = getHeaderDetails(selectedDoc);
                
                return (
                  <>
                    <div className="modal-detail">
                      {/* 👑 Tag Name Badge di Modal */}
                      {(selectedDoc.tag_name || selectedDoc.tagName) && (
                        <div className="detail-row highlight">
                          <label>🏷️ Tag Name</label>
                          <span className="tag-name-badge">{docTitle}</span>
                        </div>
                      )}

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

                      {/* 📋 Header Details di Modal */}
                      {headerDetails.length > 0 && (
                        <div className="detail-row">
                          <label>📋 Info Header</label>
                          <div className="header-details-inline">
                            {headerDetails.map((detail, idx) => (
                              <span key={idx} className="detail-inline-item">
                                <strong>{detail.label}:</strong> {detail.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ... sisa detail rows lainnya tetap sama ... */}
                      <div className="detail-row">
                        <label>📅 Dibuat pada</label>
                        <span>{new Date(selectedDoc.created_at).toLocaleString("id-ID")}</span>
                      </div>

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

                      {Object.entries(selectedDoc).map(([key, value]) => {
                        const skipFields = ['id', 'title', 'type', 'status', 'created_at', 'updated_at', 'documents', 'operator', 'shift', 'shift_group', 'board_no', '_id', '__v', 'parsed_shift', 'parsed_doc_number', 'tag_name', 'tagName', 'tanggal', 'date', 'group', 'group_name', 'jam', 'time', 'keterangan', 'material'];
                        if (skipFields.includes(key)) return null;
                        if (value === null || value === undefined) return null;
                        if (Array.isArray(value) && value.length === 0) return null;
                        if (typeof value === 'object' && Object.keys(value).length === 0) return null;

                        const formatKey = (k) => k.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                        return (
                          <div className="detail-row" key={key}>
                            <label>{formatKey(key)}</label>
                            <span className="detail-value">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
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
              <button className="btn-secondary" onClick={() => setSelectedDoc(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}