import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LabPBAdmin1.css";

export default function LabPBAdmin1() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNavigate = (path) => {
    // 🚫 Cek koneksi internet
    if (!navigator.onLine) {
      setError("❌ Tidak ada koneksi internet. Periksa jaringan kamu.");
      return;
    }

    setError("");
    setLoading(true);

    // ⏳ Transisi halus (UX)
    setTimeout(() => {
      navigate(path);
    }, 300);
  };

  // 🛑 Timeout pengaman (anti loading selamanya)
  useEffect(() => {
    if (!loading) return;

    const timeout = setTimeout(() => {
      setLoading(false);
      setError("⏱️ Koneksi lambat atau halaman gagal dimuat. Coba lagi.");
    }, 8000); // maksimal 8 detik loading

    return () => clearTimeout(timeout);
  }, [loading]);

  // 🌐 Listener online/offline
  useEffect(() => {
    const handleOffline = () => {
      setLoading(false);
      setError("⚠️ Kamu sedang offline");
    };

    const handleOnline = () => {
      setError("");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <div className="card-container">
      {/* 🔄 Loading Overlay */}
      {loading && (
        <div className="page-loading">
          Memuat halaman
        </div>
      )}

      <h2>📊 Lab PB - Admin 1</h2>

      {/* ❗ Error Message */}
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="card-grid">
        <div className="card" onClick={() => handleNavigate("analisa")}>
          <h3>🧪 QC Particleboard</h3>
          <p>Form Analisa Screen</p>
        </div>

        <div className="card" onClick={() => handleNavigate("moisture")}>
          <h3>💧 Moisture Content</h3>
          <p>Form Pengecekan kadar air</p>
        </div>

        <div className="card" onClick={() => handleNavigate("flakes")}>
          <h3>➕ Laporan Pengecekan Flakes</h3>
          <p>Form Pengecekan Flakes</p>
        </div>

        <div className="card" onClick={() => handleNavigate("resin")}>
          <h3>🛠️ Raw Resin Inspection</h3>
          <p>Form Pengecekan Raw Resin</p>
        </div>

        <div className="card" onClick={() => handleNavigate("dokumen")}>
          <h3>📂 Edit & Lihat Form</h3>
          <p>Halaman form yang sudah dikerjakan</p>
        </div>
      </div>
    </div>
  );
}
