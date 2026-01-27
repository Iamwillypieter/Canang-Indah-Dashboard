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
      const res = await fetch("http://localhost:3001/api/qc-analisa-documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat daftar dokumen");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/qc-analisa-documents/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Gagal menghapus dokumen");

      alert("✅ Dokumen berhasil dihapus");
      fetchDocuments(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menghapus dokumen");
    }
  };

  const filteredDocs = documents.filter(doc =>
    (doc.title || "QC Analisa")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
          <div className="doc-item" key={doc.id}>
            <div className="doc-info">
              <div className="doc-icon">📄</div>
              <div>
                <div className="doc-title">
                  {doc.title || "QC Analisa"}
                </div>
                <div className="doc-date">
                  {new Date(doc.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <div className="doc-actions">
              <Link
                to={`/lab/pb/admin1/analisa/${doc.id}`}
                title="Lihat / Edit"
                className="action-btn"
              >
                👁
              </Link>
              <button 
                title="Edit" 
                className="action-btn"
                onClick={() => window.location.href = `/lab/pb/admin1/analisa/${doc.id}`}
              >
                ✏️
              </button>
              <button 
                title="Hapus" 
                className="action-btn delete-btn"
                onClick={() => handleDelete(doc.id, doc.title)}
              >
                🗑
              </button>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="empty">
            📭 Tidak ada dokumen
          </div>
        )}
      </div>
    </div>
  );
}