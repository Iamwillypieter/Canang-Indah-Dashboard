// src/pages/SupervisorPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./SupervisorPage.css";

const API_BASE = "http://localhost:3001/api";

/* ================= FORM REGISTRY ================= */
const FORM_TYPES = {
  qc: {
    label: "QC Analisa",
    icon: "🧪",
    route: "/view/qc",  // ✅ CHANGE TO /view/qc
    endpoint: `${API_BASE}/qc-analisa-documents`
  },
  resin: {
    label: "Resin Inspection",
    icon: "🧴",
    route: "/view/resin",  // ✅ CHANGE TO /view/resin
    endpoint: `${API_BASE}/resin-inspection-documents`
  },
  flakes: {
    label: "Flakes Inspection",
    icon: "🪵",
    route: "/view/flakes",  // ✅ CHANGE TO /view/flakes
    endpoint: `${API_BASE}/flakes-documents`
  },
  labPBForm: {
    label: "Lab PB Form",
    icon: "🏭",
    route: "/view/lab-pb",  // ✅ CHANGE TO /view/lab-pb
    endpoint: `${API_BASE}/lab-pb-documents`
  }
};

export default function SupervisorPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Fetch dari semua endpoints
      const requests = Object.entries(FORM_TYPES).map(
        async ([key, config]) => {
          const res = await fetch(config.endpoint);
          
          if (!res.ok) {
            console.warn(`Failed to fetch ${config.label}`);
            return [];
          }

          const data = await res.json();

          // Normalisasi data
          const docsArray = Array.isArray(data)
            ? data
            : data.documents || [];

          return docsArray.map(doc => ({
            ...doc,
            type: key
          }));
        }
      );

      const results = await Promise.all(requests);

      // Gabungkan dan sort
      const mergedDocs = results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

      setDocuments(mergedDocs);
    } catch (err) {
      console.error("❌ FETCH SUPERVISOR ERROR:", err);
      alert("❌ Gagal memuat data dokumen");
    } finally {
      setLoading(false);
    }
  };

  // Filter search
  const filteredDocs = documents.filter(doc => {
    const term = search.toLowerCase();
    const config = FORM_TYPES[doc.type] || {};
    return (
      (doc.title || "").toLowerCase().includes(term) ||
      (doc.type || "").toLowerCase().includes(term) ||
      (config.label || "").toLowerCase().includes(term) ||
      (doc.status || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="supervisor-container">
      <header className="supervisor-header">
        <h1>📋 Supervisor Document Review</h1>
        <p className="supervisor-subtitle">View semua dokumen laboratory</p>
      </header>

      {/* Toolbar Search & Refresh */}
      <div className="doc-toolbar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="🔍 Cari dokumen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <span className="search-count">
            {filteredDocs.length} dokumen
          </span>
        </div>
        <button 
          onClick={fetchDocuments} 
          className="refresh-btn"
          title="Refresh data"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>⏳ Loading data dokumen...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <p>{search ? "Tidak ada dokumen yang sesuai pencarian" : "Belum ada dokumen tersedia"}</p>
          {!search && (
            <button onClick={fetchDocuments} className="refresh-btn-small">
              🔄 Refresh
            </button>
          )}
        </div>
      ) : (
        <div className="doc-grid">
          {filteredDocs.map((doc) => {
            const config = FORM_TYPES[doc.type] || FORM_TYPES.flakes;
            
            return (
              <div
                key={`${doc.type}-${doc.id}`}
                className="doc-card"
                onClick={() => setSelectedDoc(doc)}
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

                <h3 className="doc-title">{doc.title || `Dokumen ${config.label}`}</h3>

                <div className="doc-meta">
                  <p className="doc-date">
                    <span className="date-label">📅</span>
                    {new Date(doc.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                  {doc.operator && (
                    <p className="doc-operator">
                      <span className="operator-label">👤</span>
                      {doc.operator}
                    </p>
                  )}
                </div>

                {/* ========== BUTTON VIEW - MASUK KE HALAMAN FULL ========= */}
                <Link
                  to={`${config.route}/${doc.id}`}
                  className="btn-view-full"
                  onClick={(e) => e.stopPropagation()} // Prevent card click
                >
                  👁️ View Full Document
                </Link>

                {/* Hint untuk klik card */}
                <div className="view-hint">
                  ℹ️ Click card untuk preview
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================
          MODAL VIEW DETAIL (PREVIEW - READ-ONLY)
      ========================= */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
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

                      {selectedDoc.operator && (
                        <div className="detail-row">
                          <label>👤 Operator</label>
                          <span>{selectedDoc.operator}</span>
                        </div>
                      )}

                      {selectedDoc.shift && (
                        <div className="detail-row">
                          <label>🔄 Shift</label>
                          <span>{selectedDoc.shift}</span>
                        </div>
                      )}

                      {/* Tampilkan field-field lainnya */}
                      {Object.entries(selectedDoc).map(([key, value]) => {
                        // Skip field yang sudah ditampilkan atau internal
                        const skipFields = [
                          'id', 'title', 'type', 'status', 
                          'created_at', 'updated_at', 'documents',
                          'operator', 'shift', '_id', '__v'
                        ];
                        
                        if (skipFields.includes(key)) {
                          return null;
                        }
                        
                        // Skip jika value null/undefined atau empty array/object
                        if (value === null || value === undefined) {
                          return null;
                        }
                        
                        if (Array.isArray(value) && value.length === 0) {
                          return null;
                        }
                        
                        if (typeof value === 'object' && Object.keys(value).length === 0) {
                          return null;
                        }

                        // Format key untuk label
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
              <button
                className="btn-secondary"
                onClick={() => setSelectedDoc(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}