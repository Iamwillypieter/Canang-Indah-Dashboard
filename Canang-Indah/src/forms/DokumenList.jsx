import { Link } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import "./DokumenList.css";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

/* ================= FORM REGISTRY ================= */
const FORM_TYPES = {
  qc: {
    label: "QC Analisa",
    icon: "🧪",
    route: "/lab/pb/admin1/analisa",
    endpoint: `${API_BASE}/qc-analisa-documents`,
    color: "qc"
  },
  resin: {
    label: "Resin Inspection",
    icon: "🧴",
    route: "/lab/pb/admin1/resin",
    endpoint: `${API_BASE}/resin-inspection-documents`,
    color: "resin"
  },
  flakes: {
    label: "Flakes Inspection",
    icon: "🪵",
    route: "/lab/pb/admin1/flakes",
    endpoint: `${API_BASE}/flakes-documents`,
    color: "flakes"
  },
  labPBForm: {
    label: "Lab PB Form",
    icon: "🏭",
    route: "/lab/pb/admin1/lab-pb-form",
    endpoint: `${API_BASE}/lab-pb-documents`,
    color: "labpb"
  }
};

// 👇 Helper: Format tanggal konsisten
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Filters & View
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | az
  
  // 👇 UX: Toast notification state (opsional, bisa dihapus jika prefer alert)
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // 👇 UX: Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("❌ Session habis. Silakan login ulang.", "error");
      setLoading(false);
      return;
    }

    try {
      const requests = Object.entries(FORM_TYPES).map(
        async ([key, config]) => {
          const res = await fetch(config.endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!res.ok) {
            console.warn(`Failed to fetch ${config.label}`);
            return [];
          }

          const data = await res.json();
          const docsArray = Array.isArray(data) ? data : data.documents || [];
          return docsArray.map(doc => ({ ...doc, type: key }));
        }
      );

      const results = await Promise.all(requests);
      const mergedDocs = results
        .flat()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setDocuments(mergedDocs);
    } catch (err) {
      console.error(err);
      showToast("❌ Gagal memuat daftar dokumen", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    const config = FORM_TYPES[doc.type];
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("❌ Session habis. Silakan login ulang.", "error");
      return;
    }

    if (!window.confirm(`Hapus dokumen "${getDocumentTitle(doc)}"?`)) return;

    try {
      const res = await fetch(`${config.endpoint}/${doc.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal hapus");
      }

      showToast("✅ Dokumen berhasil dihapus", "success");
      fetchDocuments();
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    }
  };

  const getDocumentTitle = (doc) => {
    if (doc.document_name?.trim()) return doc.document_name.trim();
    const rawTag = doc.tag_name || doc.tagName || doc.tagname;
    if (rawTag?.trim()) return rawTag.trim();
    if (doc.title?.trim()) return doc.title.trim();
    if (doc.document_title?.trim()) return doc.document_title.trim();
    return `${FORM_TYPES[doc.type]?.label || "Dokumen"} #${doc.id}`;
  };

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
    if (shiftVal) details.push({ label: "Shift", value: shiftVal });
    
    const groupVal = doc.group || doc.group_name || doc.groupName;
    if (groupVal) details.push({ label: "Group", value: groupVal });
    
    const jamVal = doc.jam || doc.time;
    if (jamVal) details.push({ label: "Jam", value: jamVal });
    
    const boardVal = doc.board_no || doc.boardNo || doc.lot_no || doc.batch_no;
    if (boardVal) details.push({ label: "Board", value: boardVal });
    
    const ukuranVal = doc.ukuranPapan || doc.ukuran_papan;
    if (ukuranVal) details.push({ label: "Ukuran", value: ukuranVal });

    if (doc.type === "resin") {
      const inspection = doc.inspection?.[0] || {};
      if (inspection.resinTank) details.push({ label: "Resin Tank", value: inspection.resinTank });
      if (inspection.certTestNo) details.push({ label: "Cert No", value: inspection.certTestNo });
      if (inspection.quantity) details.push({ label: "Quantity", value: inspection.quantity });
      if (doc.comment_by) details.push({ label: "Comment", value: doc.comment_by });
    }

    return details;
  };

  // 👇 Enhanced filtering + sorting
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

    // 👇 Sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "az") {
      result.sort((a, b) => getDocumentTitle(a).localeCompare(getDocumentTitle(b)));
    }

    return result;
  }, [documents, dateFilter, typeFilter, search, sortBy]);

  const groupedDocs = useMemo(() => {
    const groups = {};
    filteredDocs.forEach(doc => {
      if (!groups[doc.type]) groups[doc.type] = [];
      groups[doc.type].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  // 👇 Filter management helpers
  const clearFilters = () => {
    setDateFilter("");
    setTypeFilter("all");
    setSearch("");
    setSortBy("newest");
  };

  const removeFilterChip = (filterType) => {
    if (filterType === 'date') setDateFilter("");
    if (filterType === 'type') setTypeFilter("all");
    if (filterType === 'search') setSearch("");
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (search) filters.push({ type: 'search', label: `🔍 "${search}"` });
    if (dateFilter) {
      const formatted = new Date(dateFilter).toLocaleDateString("id-ID");
      filters.push({ type: 'date', label: `📅 ${formatted}` });
    }
    if (typeFilter !== "all") {
      filters.push({ type: 'type', label: `${FORM_TYPES[typeFilter]?.icon} ${FORM_TYPES[typeFilter]?.label}` });
    }
    return filters;
  }, [search, dateFilter, typeFilter]);

  // 👇 Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="doc-item skeleton">
      <div className="doc-info">
        <div className="doc-icon skeleton-box" />
        <div className="doc-content">
          <div className="skeleton-line title" />
          <div className="skeleton-line short" />
          <div className="skeleton-line short" />
        </div>
      </div>
      <div className="doc-actions">
        <div className="skeleton-box action" />
        <div className="skeleton-box action" />
        <div className="skeleton-box action" />
      </div>
    </div>
  );

  return (
    <div className="doc-container">
      {/* 👇 Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          {toast.message}
        </div>
      )}

      <h2>📁 My Documents</h2>

      {/* 🔥 ENHANCED TOOLBAR */}
      <div className="doc-toolbar">
        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Cari Tag, Board, Shift..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
            aria-label="Cari dokumen"
          />
          {search && (
            <button 
              className="clear-btn" 
              onClick={() => setSearch("")}
              aria-label="Hapus pencarian"
            >✕</button>
          )}
        </div>

        {/* Filters Row */}
        <div className="filters-row">
          {/* Date Filter */}
          <div className="filter-section">
            <label className="filter-label" htmlFor="date-filter">📅</label>
            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-input"
            />
          </div>

          {/* Type Filter */}
          <div className="filter-section">
            <label className="filter-label" htmlFor="type-filter">📋</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="type-select"
              aria-label="Filter jenis form"
            >
              <option value="all">🗂️ Semua</option>
              <option value="qc">🧪 QC</option>
              <option value="resin">🧴 Resin</option>
              <option value="flakes">🪵 Flakes</option>
              <option value="labPBForm">🏭 Lab PB</option>
            </select>
          </div>

          {/* Sort */}
          <div className="filter-section">
            <label className="filter-label" htmlFor="sort-select">🔃</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="type-select"
              aria-label="Urutkan"
            >
              <option value="newest">🕐 Terbaru</option>
              <option value="oldest">🕑 Terlama</option>
              <option value="az">🔤 A-Z</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="toolbar-actions">
          <div className="view-toggle" role="tablist" aria-label="Mode tampilan">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              role="tab"
              aria-selected={viewMode === 'list'}
            >📄 List</button>
            <button 
              className={`toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`}
              onClick={() => setViewMode('grouped')}
              role="tab"
              aria-selected={viewMode === 'grouped'}
            >📊 Group</button>
          </div>
          <button onClick={fetchDocuments} className="refresh-btn" aria-label="Refresh data">🔄</button>
        </div>
      </div>

      {/* 👇 Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="filter-chips" aria-label="Filter aktif">
          {activeFilters.map((chip, idx) => (
            <span key={idx} className="filter-chip">
              {chip.label}
              <button 
                onClick={() => removeFilterChip(chip.type)}
                className="chip-remove"
                aria-label={`Hapus filter ${chip.label}`}
              >✕</button>
            </span>
          ))}
          <button onClick={clearFilters} className="reset-chips">🔄 Reset Semua</button>
        </div>
      )}

      {/* 👇 Result Count */}
      <div className="result-count" aria-live="polite">
        Menampilkan {filteredDocs.length} dari {documents.length} dokumen
      </div>

      {/* 👇 GROUPED VIEW */}
      {viewMode === "grouped" && (
        <div className="grouped-view">
          {loading ? (
            <div className="doc-grid">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : Object.keys(groupedDocs).length === 0 ? (
            <EmptyState 
              hasActiveFilters={activeFilters.length > 0} 
              onReset={clearFilters} 
              search={search}
            />
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
                    {docs.map(doc => (
                      <DocumentCard 
                        key={`${doc.type}-${doc.id}`} 
                        doc={doc} 
                        config={config}
                        getDocumentTitle={getDocumentTitle}
                        getHeaderDetails={getHeaderDetails}
                        onDelete={handleDelete}
                        viewMode="grouped"
                      />
                    ))}
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
            <div className="doc-list">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredDocs.length === 0 ? (
            <EmptyState 
              hasActiveFilters={activeFilters.length > 0} 
              onReset={clearFilters} 
              search={search}
            />
          ) : (
            <div className="doc-list">
              {filteredDocs.map(doc => {
                const config = FORM_TYPES[doc.type];
                return (
                  <DocumentCard 
                    key={`${doc.type}-${doc.id}`} 
                    doc={doc} 
                    config={config}
                    getDocumentTitle={getDocumentTitle}
                    getHeaderDetails={getHeaderDetails}
                    onDelete={handleDelete}
                    viewMode="list"
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 👇 Reusable Document Card Component (DRY + Maintainable)
function DocumentCard({ doc, config, getDocumentTitle, getHeaderDetails, onDelete, viewMode }) {
  const docTitle = getDocumentTitle(doc);
  const headerDetails = getHeaderDetails(doc);
  const primaryDetail = headerDetails[0]; // Show most important detail prominently

  return (
    <div className={`doc-item ${viewMode === 'grouped' ? 'compact' : ''}`} role="article">
      <div className="doc-info">
        <div className="doc-icon" aria-hidden="true">{config.icon}</div>
        <div className="doc-content">
          <div className="doc-title-wrapper">
            <div className="doc-title-main">
              <span className="doc-title-default">🏷️ {docTitle}</span>
              {doc.tag_name && doc.document_name && (
                <div className="doc-subtitle" title={`Tag: ${doc.tag_name}`}>
                  Tag: {doc.tag_name}
                </div>
              )}
            </div>
            <span className={`badge badge-${doc.type}`} aria-label={`Jenis: ${config.label}`}>
              {config.label}
            </span>
          </div>

          {/* 👇 Primary detail highlighted */}
          {primaryDetail && (
            <div className="doc-primary-detail">
              <strong>{primaryDetail.label}:</strong> {primaryDetail.value}
            </div>
          )}

          {/* 👇 Secondary details as chips */}
          {headerDetails.length > 1 && (
            <div className="doc-secondary-details">
              {headerDetails.slice(1, 4).map((detail, idx) => (
                <span key={idx} className="detail-chip">
                  {detail.value}
                </span>
              ))}
            </div>
          )}

          <div className="doc-meta" title={`Dibuat: ${formatDate(doc.created_at)}`}>
            {formatDate(doc.created_at)}
          </div>
        </div>
      </div>

      <div className="doc-actions" role="group" aria-label="Aksi dokumen">
        <Link 
          to={`${config.route}/${doc.id}`} 
          className="action-btn view-btn" 
          title="Lihat Detail"
          aria-label={`Lihat detail ${docTitle}`}
        >👁</Link>
        <Link 
          to={`${config.route}/${doc.id}/edit`} 
          className="action-btn edit-btn" 
          title="Edit Dokumen"
          aria-label={`Edit ${docTitle}`}
        >✏️</Link>
        <button 
          className="action-btn delete-btn" 
          onClick={() => onDelete(doc)} 
          title="Hapus"
          aria-label={`Hapus ${docTitle}`}
        >🗑</button>
      </div>
    </div>
  );
}

// 👇 Reusable Empty State Component
function EmptyState({ hasActiveFilters, onReset, search }) {
  return (
    <div className="empty" role="status">
      <div className="empty-icon" aria-hidden="true">📭</div>
      <h3>
        {hasActiveFilters || search ? "Tidak ada hasil" : "📭 Belum ada dokumen"}
      </h3>
      <p className="empty-message">
        {hasActiveFilters 
          ? "Coba hapus beberapa filter atau reset untuk melihat semua dokumen." 
          : search 
            ? `Tidak ditemukan dokumen untuk "${search}"` 
            : "Dokumen yang kamu buat akan muncul di sini."}
      </p>
      {(hasActiveFilters || search) && (
        <button onClick={onReset} className="reset-btn">🔄 Reset Filter</button>
      )}
    </div>
  );
}