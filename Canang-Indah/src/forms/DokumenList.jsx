import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./DokumenList.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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

  // 👇 Helper: Ambil judul dokumen (prioritaskan tag_name - robust version)
  const getDocumentTitle = (doc) => {
    // Prioritas 1: tag_name dalam berbagai variasi (snake_case, camelCase, lowercase)
    const rawTag = doc.tag_name || doc.tagName || doc.tagname;
    if (rawTag?.trim()) return rawTag.trim();
    
    // Prioritas 2: title / document_title
    if (doc.title?.trim()) return doc.title.trim();
    if (doc.document_title?.trim()) return doc.document_title.trim();
    
    // Fallback: label form + ID
    return `${FORM_TYPES[doc.type]?.label || "Dokumen"} #${doc.id}`;
  };

  // 👇 Helper: Ambil detail header (dengan fallback lengkap untuk semua form)
  const getHeaderDetails = (doc) => {
    const details = [];
    
    // 📅 Tanggal (support multiple field names)
    const dateVal = doc.tanggal || doc.date;
    if (dateVal) {
      const formatted = new Date(dateVal).toLocaleDateString("id-ID", {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      details.push({ label: "Tanggal", value: formatted });
    }
    
    // 🔄 Shift (support multiple field names)
    const shiftVal = doc.shift || doc.shift_group || doc.shiftGroup;
    if (shiftVal) {
      details.push({ label: "Shift", value: shiftVal });
    }
    
    // 👥 Group (support multiple field names)
    const groupVal = doc.group || doc.group_name || doc.groupName;
    if (groupVal) {
      details.push({ label: "Group", value: groupVal });
    }
    
    // ⏰ Jam
    const jamVal = doc.jam || doc.time;
    if (jamVal) {
      details.push({ label: "Jam", value: jamVal });
    }
    
    // 🪵 Board/Lot No
    const boardVal = doc.board_no || doc.boardNo || doc.lot_no || doc.batch_no;
    if (boardVal) {
      details.push({ label: "Board/Lot", value: boardVal });
    }
    
    // 📏 Ukuran Papan (Flakes)
    const ukuranVal = doc.ukuranPapan || doc.ukuran_papan;
    if (ukuranVal) {
      details.push({ label: "Ukuran", value: ukuranVal });
    }

    // 🧴 RESIN SPECIFIC: Ambil dari nested inspection[0]
    if (doc.type === "resin") {
      const inspection = doc.inspection?.[0] || {};
      
      if (inspection.resinTank) {
        details.push({ label: "Resin Tank", value: inspection.resinTank });
      }
      if (inspection.certTestNo) {
        details.push({ label: "Cert No", value: inspection.certTestNo });
      }
      if (inspection.quantity) {
        details.push({ label: "Quantity", value: inspection.quantity });
      }
      if (doc.comment_by) {
        details.push({ label: "Comment", value: doc.comment_by });
      }
    }

    return details;
  };

  // 👇 Filter search: support tag_name + semua field relevan
  const filteredDocs = documents.filter(doc => {
    const term = search.toLowerCase();
    
    // Search di tag_name (semua variasi)
    const rawTag = (doc.tag_name || doc.tagName || doc.tagname || "").toLowerCase();
    const matchesTag = rawTag.includes(term);
    
    // Search di title fallback
    const title = (doc.title || doc.document_title || "").toLowerCase();
    const matchesTitle = title.includes(term);
    
    // Search di type label
    const matchesType = FORM_TYPES[doc.type]?.label.toLowerCase().includes(term);
    
    // Search di header details
    const headerDetails = getHeaderDetails(doc);
    const matchesHeader = headerDetails.some(d => 
      d.value?.toString().toLowerCase().includes(term)
    );
    
    // Search di keterangan/notes
    const keterangan = (doc.keterangan || doc.notes || doc.remarks || "").toLowerCase();
    const matchesKeterangan = keterangan.includes(term);

    // 🔧 FORM SPECIFIC SEARCH
    let matchesFormFields = false;
    
    // Resin specific
    if (doc.type === "resin") {
      const inspection = doc.inspection?.[0] || {};
      const resinTank = inspection.resinTank?.toLowerCase() || "";
      const certTestNo = inspection.certTestNo?.toLowerCase() || "";
      const commentBy = doc.comment_by?.toLowerCase() || "";
      const groupName = doc.group_name?.toLowerCase() || "";
      
      matchesFormFields = 
        resinTank.includes(term) || 
        certTestNo.includes(term) || 
        commentBy.includes(term) ||
        groupName.includes(term);
    }
    
    // QC specific
    if (doc.type === "qc") {
      const shiftGroup = doc.shift_group?.toLowerCase() || "";
      const tanggal = doc.tanggal?.toLowerCase() || "";
      const material = doc.material?.toLowerCase() || "";
      
      matchesFormFields = 
        shiftGroup.includes(term) || 
        tanggal.includes(term) ||
        material.includes(term);
    }

    return matchesTag || matchesTitle || matchesType || matchesHeader || matchesKeterangan || matchesFormFields;
  });

  return (
    <div className="doc-container">
      <h2>📁 My Documents</h2>

      <div className="doc-toolbar">
        <input
          type="text"
          placeholder="Cari berdasarkan Tag Name, Tanggal, Shift, dll..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <button onClick={fetchDocuments} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="doc-list">
        {loading && <div className="empty">⏳ Loading data...</div>}

        {!loading && filteredDocs.map(doc => {
          const config = FORM_TYPES[doc.type];
          const docTitle = getDocumentTitle(doc);
          const headerDetails = getHeaderDetails(doc);
          
          // 👇 Robust tag name detection
          const rawTagName = doc.tag_name || doc.tagName || doc.tagname;
          const hasTagName = !!(rawTagName?.trim());
          const displayName = hasTagName ? rawTagName.trim() : docTitle;

          return (
            <div className="doc-item" key={`${doc.type}-${doc.id}`}>
              <div className="doc-info">
                <div className="doc-icon">{config.icon}</div>
                <div className="doc-content">
                  
                  {/* 👑 JUDUL UTAMA: Tag Name Badge (jika ada) */}
                  <div className="doc-title-wrapper">
                    {hasTagName && (
                      <span className="tag-name-badge">
                        🏷️ {displayName}
                      </span>
                    )}
                    {!hasTagName && (
                      <span className="doc-title-default">
                        {displayName}
                      </span>
                    )}
                    
                    <span className={`badge badge-${doc.type}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* 📋 DETAIL HEADER di bawah judul */}
                  {headerDetails.length > 0 && (
                    <div className="doc-header-details">
                      {headerDetails.map((detail, idx) => (
                        <span key={idx} className="detail-item">
                          <strong>{detail.label}:</strong> {detail.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 📅 Tanggal Created */}
                  <div className="doc-meta">
                    Dibuat: {new Date(doc.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* 🔘 ACTION BUTTONS */}
              <div className="doc-actions">
                <Link
                  to={`${config.route}/${doc.id}`}
                  className="action-btn view-btn"
                  title="Lihat Detail"
                >
                  👁
                </Link>

                <Link
                  to={`${config.route}/${doc.id}/edit`}
                  className="action-btn edit-btn"
                  title="Edit Dokumen"
                >
                  ✏️
                </Link>

                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(doc)}
                  title="Hapus"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}

        {!loading && filteredDocs.length === 0 && (
          <div className="empty">
            {search ? `🔍 Tidak ditemukan untuk "${search}"` : "📭 Belum ada dokumen"}
          </div>
        )}
      </div>
    </div>
  );
}