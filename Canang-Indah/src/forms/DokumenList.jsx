import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./DokumenList.css";

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const [qcRes, resinRes] = await Promise.all([
        fetch("http://localhost:3001/api/qc-analisa-documents"),
        fetch("http://localhost:3001/api/resin-inspection-documents")
      ]);

      const qcDocs = await qcRes.json();
      const resinDocs = await resinRes.json();

      const mergedDocs = [
        ...qcDocs.map(doc => ({ ...doc, type: "qc" })),
        ...resinDocs.map(doc => ({ ...doc, type: "resin" }))
      ].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setDocuments(mergedDocs);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal memuat daftar dokumen");
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${doc.title}"?`)) {
      return;
    }

    const url =
      doc.type === "qc"
        ? `http://localhost:3001/api/qc-analisa-documents/${doc.id}`
        : `http://localhost:3001/api/resin-inspection-documents/${doc.id}`;

    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();

      alert("✅ Dokumen berhasil dihapus");
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menghapus dokumen");
    }
  };

  const filteredDocs = documents.filter(doc =>
    (doc.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const getRoute = (doc) =>
    doc.type === "qc"
      ? `/lab/pb/admin1/analisa/${doc.id}`
      : `/lab/pb/admin1/resin/${doc.id}`;

  const getIcon = (type) =>
    type === "qc" ? "🧪" : "🧴";

  const getLabel = (type) =>
    type === "qc" ? "QC Analisa" : "Resin Inspection";

  return (
    <div className="doc-container">
      <h2>📁 My Documents</h2>

      {/* Toolbar */}
      <div className="doc-toolbar">
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="filter-btn">Filter</button>
      </div>

      {/* Document List */}
      <div className="doc-list">
        {filteredDocs.map(doc => (
          <div className="doc-item" key={`${doc.type}-${doc.id}`}>
            <div className="doc-info">
              <div className="doc-icon">{getIcon(doc.type)}</div>
              <div>
                <div className="doc-title">
                  {doc.title || getLabel(doc.type)}
                </div>
                <div className="doc-date">
                  {getLabel(doc.type)} •{" "}
                  {new Date(doc.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>
              </div>
            </div>

            <div className="doc-actions">
              <Link
                to={getRoute(doc)}
                title="Lihat / Edit"
                className="action-btn"
              >
                👁
              </Link>

              <button
                title="Edit"
                className="action-btn"
                onClick={() => (window.location.href = getRoute(doc))}
              >
                ✏️
              </button>

              <button
                title="Hapus"
                className="action-btn delete-btn"
                onClick={() => handleDelete(doc)}
              >
                🗑
              </button>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="empty">📭 Tidak ada dokumen</div>
        )}
      </div>
    </div>
  );
}
