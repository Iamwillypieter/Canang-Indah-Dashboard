import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import "./DokumenList.css";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

/* ================= FORM REGISTRY ================= */
const FORM_TYPES = {
  qc: {
    label: "QC Analisa",
    icon: "🧪",
    route: "/lab/pb/admin1/analisa",
    endpoint: `${API_BASE}/qc-analisa-documents`
  },
  resin: {
    label: "Resin Inspection",
    icon: "🧴",
    route: "/lab/pb/admin1/resin",
    endpoint: `${API_BASE}/resin-inspection-documents`
  },
  flakes: {
    label: "Flakes Inspection",
    icon: "🪵",
    route: "/lab/pb/admin1/flakes",
    endpoint: `${API_BASE}/flakes-documents`
  },
  labPBForm: {
    label: "Lab PB Form",
    icon: "🏭",
    route: "/lab/pb/admin1/lab-pb-form",
    endpoint: `${API_BASE}/lab-pb-documents`
  }
};

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // 👇 NEW: Date Filter & Type Filter & View Mode
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'qc' | 'resin' | 'flakes' | 'labPBForm'
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'grouped'

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const requests = Object.entries(FORM_TYPES).map(
        async ([key, config]) => {
          const res = await fetch(config.endpoint);
          if (!res.ok) {
            console.warn(`Failed to fetch ${config.label}`);
            return [];
          }

          const data = await res.json();
          const docsArray = Array.isArray(data) ? data : data.documents || [];

          return docsArray.map(doc => ({
            ...doc,
            type: key
          }));
        }
      );

      const results = await Promise.all(requests);
      const mergedDocs = results
        .flat()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setDocuments(mergedDocs);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal memuat daftar dokumen");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    const config = FORM_TYPES[doc.type];
    if (!window.confirm(`Hapus dokumen "${getDocumentTitle(doc)}"?`)) return;

    try {
      const res = await fetch(`${config.endpoint}/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      alert("✅ Dokumen berhasil dihapus");
      fetchDocuments();
    } catch (err) {
      alert("❌ Gagal menghapus dokumen");
    }
  };

  // 👇 Helper: Ambil judul dokumen (prioritaskan tag_name)
  const getDocumentTitle = (doc) => {
    const rawTag = doc.tag_name || doc.tagName || doc.tagname;
    if (rawTag?.trim()) return rawTag.trim();
    if (doc.title?.trim()) return doc.title.trim();
    if (doc.document_title?.trim()) return doc.document_title.trim();
    return `${FORM_TYPES[doc.type]?.label || "Dokumen"} #${doc.id}`;
  };

  // 👇 Helper: Ambil detail header
  const getHeaderDetails = (doc) => {
    const details = [];
    
    const dateVal = doc.tanggal || doc.date;
    if (dateVal) {
      const formatted = new Date(dateVal).toLocaleDateString("id-ID", {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      details.push({ label: "Tanggal", value: formatted });
    }
    
    const shiftVal = doc.shift || doc.shift_group || doc.shiftGroup;
    if (shiftVal) {
      details.push({ label: "Shift", value: shiftVal });
    }
    
    const groupVal = doc.group || doc.group_name || doc.groupName;
    if (groupVal) {
      details.push({ label: "Group", value: groupVal });
    }
    
    const jamVal = doc.jam || doc.time;
    if (jamVal) {
      details.push({ label: "Jam", value: jamVal });
    }
    
    const boardVal = doc.board_no || doc.boardNo || doc.lot_no || doc.batch_no;
    if (boardVal) {
      details.push({ label: "Board", value: boardVal });
    }
    
    const ukuranVal = doc.ukuranPapan || doc.ukuran_papan;
    if (ukuranVal) {
      details.push({ label: "Ukuran", value: ukuranVal });
    }

    if (doc.type === "resin") {
      const inspection = doc.inspection?.[0] || {};
      if (inspection.resinTank) details.push({ label: "Resin Tank", value: inspection.resinTank });
      if (inspection.certTestNo) details.push({ label: "Cert No", value: inspection.certTestNo });
      if (inspection.quantity) details.push({ label: "Quantity", value: inspection.quantity });
      if (doc.comment_by) details.push({ label: "Comment", value: doc.comment_by });
    }

    return details;
  };

  // 👇 Filter: Date + Type + Search
  const filteredDocs = useMemo(() => {
    let result = [...documents];

    // Filter by Date
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

    // Filter by Type
    if (typeFilter !== "all") {
      result = result.filter(doc => doc.type === typeFilter);
    }

    // Filter by Search
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(doc => {
        const rawTag = (doc.tag_name || doc.tagName || doc.tagname || "").toLowerCase();
        const title = (doc.title || doc.document_title || "").toLowerCase();
        const keterangan = (doc.keterangan || doc.notes || doc.remarks || "").toLowerCase();
        
        const matchesTag = rawTag.includes(term);
        const matchesTitle = title.includes(term);
        const matchesType = FORM_TYPES[doc.type]?.label.toLowerCase().includes(term);
        const matchesKeterangan = keterangan.includes(term);
        
        const headerDetails = getHeaderDetails(doc);
        const matchesHeader = headerDetails.some(d => 
          d.value?.toString().toLowerCase().includes(term)
        );

        let matchesFormFields = false;
        if (doc.type === "resin") {
          const inspection = doc.inspection?.[0] || {};
          matchesFormFields = 
            (inspection.resinTank?.toLowerCase() || "").includes(term) || 
            (inspection.certTestNo?.toLowerCase() || "").includes(term) || 
            (doc.comment_by?.toLowerCase() || "").includes(term);
        }
        if (doc.type === "qc") {
          matchesFormFields = 
            (doc.shift_group?.toLowerCase() || "").includes(term) || 
            (doc.tanggal?.toLowerCase() || "").includes(term);
        }

        return matchesTag || matchesTitle || matchesType || matchesHeader || matchesKeterangan || matchesFormFields;
      });
    }

    return result;
  }, [documents, dateFilter, typeFilter, search]);

  // 👇 Group documents by type (untuk Grouped View)
  const groupedDocs = useMemo(() => {
    const groups = {};
    filteredDocs.forEach(doc => {
      if (!groups[doc.type]) {
        groups[doc.type] = [];
      }
      groups[doc.type].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  // 👇 Clear all filters
  const clearFilters = () => {
    setDateFilter("");
    setTypeFilter("all");
    setSearch("");
  };

  return (
    <div className="doc-container">
      <h2>📁 My Documents</h2>

      {/* 🔥 ENHANCED TOOLBAR WITH DATE & TYPE FILTER */}
      <div className="doc-toolbar">
        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Cari Tag Name, Board, Shift..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Date Filter */}
        <div className="filter-section">
          <label className="filter-label">📅 Tanggal:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-input"
          />
          {dateFilter && (
            <button className="clear-btn" onClick={() => setDateFilter("")}>✕</button>
          )}
        </div>

        {/* Type Filter */}
        <div className="filter-section">
          <label className="filter-label">📋 Form:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="type-select"
          >
            <option value="all">🗂️ Semua Form</option>
            <option value="qc">🧪 QC Analisa</option>
            <option value="resin">🧴 Resin Inspection</option>
            <option value="flakes">🪵 Flakes Inspection</option>
            <option value="labPBForm">🏭 Lab PB Form</option>
          </select>
        </div>

        {/* View Toggle & Actions */}
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
          {(dateFilter || typeFilter !== "all" || search) && (
            <button onClick={clearFilters} className="reset-btn">🔄 Reset</button>
          )}
        </div>
      </div>

      {/* 👇 GROUPED VIEW */}
      {viewMode === "grouped" && (
        <div className="grouped-view">
          {Object.keys(groupedDocs).length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>Tidak ada dokumen</p>
              {(dateFilter || typeFilter !== "all" || search) && (
                <button onClick={clearFilters} className="reset-btn">🔄 Reset Filter</button>
              )}
            </div>
          ) : (
            Object.entries(groupedDocs).map(([type, docs]) => {
              const config = FORM_TYPES[type];
              if (docs.length === 0) return null;

              return (
                <div key={type} className="type-group">
                  <div className="type-group-header">
                    <h3 className="type-group-title">
                      {config.icon} {config.label}
                      <span className="type-count">({docs.length})</span>
                    </h3>
                  </div>

                  <div className="doc-grid">
                    {docs.map(doc => {
                      const docTitle = getDocumentTitle(doc);
                      const headerDetails = getHeaderDetails(doc);
                      const rawTagName = doc.tag_name || doc.tagName || doc.tagname;
                      const hasTagName = !!(rawTagName?.trim());
                      const displayName = hasTagName ? rawTagName.trim() : docTitle;

                      return (
                        <div className="doc-item" key={`${doc.type}-${doc.id}`}>
                          <div className="doc-info">
                            <div className="doc-icon">{config.icon}</div>
                            <div className="doc-content">
                              <div className="doc-title-wrapper">
                                {hasTagName && (
                                  <span className="tag-name-badge">🏷️ {displayName}</span>
                                )}
                                {!hasTagName && (
                                  <span className="doc-title-default">{displayName}</span>
                                )}
                                <span className={`badge badge-${doc.type}`}>{config.label}</span>
                              </div>

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
                                Dibuat: {new Date(doc.created_at).toLocaleString("id-ID")}
                              </div>
                            </div>
                          </div>

                          <div className="doc-actions">
                            <Link to={`${config.route}/${doc.id}`} className="action-btn view-btn" title="Lihat Detail">👁</Link>
                            <Link to={`${config.route}/${doc.id}/edit`} className="action-btn edit-btn" title="Edit Dokumen">✏️</Link>
                            <button className="action-btn delete-btn" onClick={() => handleDelete(doc)} title="Hapus">🗑</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 👇 LIST VIEW */}
      {viewMode === "list" && (
        <>
          {loading ? (
            <div className="empty">⏳ Loading data...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>
                {dateFilter || typeFilter !== "all" || search 
                  ? "Tidak ada dokumen yang sesuai filter" 
                  : "📭 Belum ada dokumen"}
              </p>
              {(dateFilter || typeFilter !== "all" || search) && (
                <button onClick={clearFilters} className="reset-btn">🔄 Reset Filter</button>
              )}
            </div>
          ) : (
            <div className="doc-list">
              {filteredDocs.map(doc => {
                const config = FORM_TYPES[doc.type];
                const docTitle = getDocumentTitle(doc);
                const headerDetails = getHeaderDetails(doc);
                const rawTagName = doc.tag_name || doc.tagName || doc.tagname;
                const hasTagName = !!(rawTagName?.trim());
                const displayName = hasTagName ? rawTagName.trim() : docTitle;

                return (
                  <div className="doc-item" key={`${doc.type}-${doc.id}`}>
                    <div className="doc-info">
                      <div className="doc-icon">{config.icon}</div>
                      <div className="doc-content">
                        <div className="doc-title-wrapper">
                          {hasTagName && (
                            <span className="tag-name-badge">🏷️ {displayName}</span>
                          )}
                          {!hasTagName && (
                            <span className="doc-title-default">{displayName}</span>
                          )}
                          <span className={`badge badge-${doc.type}`}>{config.label}</span>
                        </div>

                        {headerDetails.length > 0 && (
                          <div className="doc-header-details">
                            {headerDetails.map((detail, idx) => (
                              <span key={idx} className="detail-item">
                                <strong>{detail.label}:</strong> {detail.value}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="doc-meta">
                          Dibuat: {new Date(doc.created_at).toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>

                    <div className="doc-actions">
                      <Link to={`${config.route}/${doc.id}`} className="action-btn view-btn" title="Lihat Detail">👁</Link>
                      <Link to={`${config.route}/${doc.id}/edit`} className="action-btn edit-btn" title="Edit Dokumen">✏️</Link>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(doc)} title="Hapus">🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}