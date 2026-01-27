import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./DokumenList.css";

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/qc-analisa-documents")
        .then(res => res.json())
        .then(data => setDocuments(data))
        .catch(err => console.error(err));
    }, []);


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
                  {new Date(doc.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="doc-actions">
              <Link
                to={`/lab/pb/admin1/analisa/${doc.id}`}
                title="Lihat / Edit"
              >
                👁
              </Link>
              <button title="Edit">✏️</button>
              <button title="Hapus">🗑</button>
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
