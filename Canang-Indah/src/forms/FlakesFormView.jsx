import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import FlakesForm from "./FlakesForm";
import "./FlakesFormView.css";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

export default function FlakesFormView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocument();
    } else {
      setLoading(false);
    }
  }, [id]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_BASE}/flakes-documents/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Dokumen tidak ditemukan");
      }

      const data = await res.json();
      setDoc(data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch document error:', err);
      setError(err.message || "Gagal memuat dokumen Flakes");
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleBack = () => {
    navigate('/lab/pb/admin1/documents');
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0';
    const num = parseFloat(value);
    return isNaN(num) ? '0' : num.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="flakes-view-container">
        <div className="flakes-view-loading">
          <div className="spinner"></div>
          <p>⏳ Memuat dokumen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flakes-view-container">
        <div className="flakes-view-error">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button onClick={handleBack} className="btn-back-home">
            Kembali ke Daftar Dokumen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flakes-view-container">
      <div className="flakes-view-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="main-title">🌾 Laporan Pengecekan Flakes</h1>
            {id && (
              <div className="doc-badge">
                {isEditMode ? '📝 Mode Edit' : '👁️ Mode View'}
              </div>
            )}
          </div>

          {id && doc && (
            <div className="doc-meta-info">
              <div className="meta-item">
                <span className="meta-label">📅 Tanggal:</span>
                <span className="meta-value">
                  {doc.header?.tanggal
                    ? new Date(doc.header.tanggal).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })
                    : "-"}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">🕐 Jam:</span>
                <span className="meta-value">
                  {doc.header?.jam || "-"}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">👥 Shift:</span>
                <span className="meta-value">
                  {doc.header?.shift || "-"}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">👥 Group:</span>
                <span className="meta-value">
                  {doc.header?.group || "-"}
                </span>
              </div>
            </div>
          )}

          {id && doc?.summary && (
            <div className="summary-stats">
              <div className="stat-card">
                <div className="stat-label">Total Jumlah</div>
                <div className="stat-value">{doc.summary.total_jumlah || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Grand Total Ketebalan</div>
                <div className="stat-value">{formatNumber(doc.summary.grand_total_ketebalan)} mm</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Rata-rata Ketebalan</div>
                <div className="stat-value">{formatNumber(doc.summary.rata_rata)} mm</div>
              </div>
            </div>
          )}
        </div>

        <div className="header-actions">
          {id && (
            <button
              className={`btn-toggle-mode ${isEditMode ? 'active' : ''}`}
              onClick={handleEditToggle}
              title={isEditMode ? "Kembali ke mode view" : "Edit dokumen"}
            >
              {isEditMode ? '👁️ View Mode' : '✏️ Edit Mode'}
            </button>
          )}
          
          <button
            className="btn-back"
            onClick={handleBack}
            title="Kembali ke daftar dokumen"
          >
            ⬅ Kembali ke Daftar
          </button>
        </div>
      </div>

      <div className="flakes-view-form">
        <FlakesForm isEditMode={isEditMode} />
      </div>
    </div>
  );
}