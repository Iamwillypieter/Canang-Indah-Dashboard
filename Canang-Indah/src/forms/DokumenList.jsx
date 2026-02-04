import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./DokumenList.css";

const API_BASE = "http://localhost:3001/api";

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

          // 🔥 NORMALISASI DI SINI
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

      const mergedDocs = results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

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

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus "${doc.title || config.label}"?`
      )
    ) return;

    try {
      const res = await fetch(
        `${config.endpoint}/${doc.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error();

      alert("✅ Dokumen berhasil dihapus");
      fetchDocuments();
    } catch (err) {
      alert("❌ Gagal menghapus dokumen");
    }
  };

  const filteredDocs = documents.filter(doc => {
    const term = search.toLowerCase();
    return (
      (doc.title || "").toLowerCase().includes(term) ||
      FORM_TYPES[doc.type].label.toLowerCase().includes(term)
    );
  });

  return (
    <div className="doc-container">
      <h2>📁 My Documents</h2>

      <div className="doc-toolbar">
        <input
          type="text"
          placeholder="Search Document..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={fetchDocuments}>Refresh</button>
      </div>

      <div className="doc-list">
        {loading && <div className="empty">Loading data...</div>}

        {!loading && filteredDocs.map(doc => {
          const config = FORM_TYPES[doc.type];
          return (
            <div className="doc-item" key={`${doc.type}-${doc.id}`}>
              <div className="doc-info">
                <div className="doc-icon">{config.icon}</div>
                <div>
                  <div className="doc-title">
                    {doc.title || config.label}
                  </div>
                  <div className="doc-date">
                    <span className={`badge badge-${doc.type}`}>
                      {config.label}
                    </span>{" "}
                    •{" "}
                    {new Date(doc.created_at).toLocaleDateString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="doc-actions">
                <Link
                  to={`${config.route}/${doc.id}`}
                  className="action-btn"
                  title="Detail"
                >
                  👁
                </Link>

                <Link
                  to={`${config.route}/${doc.id}/edit`}
                  className="action-btn"
                  title="Edit"
                >
                  ✏️
                </Link>

                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(doc)}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}

        {!loading && filteredDocs.length === 0 && (
          <div className="empty">📭 No Document</div>
        )}
      </div>
    </div>
  );
}