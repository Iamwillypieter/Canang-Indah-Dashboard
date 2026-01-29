import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./FlakesForm.css";

const FlakesForm = ({ isEditMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const mode = id ? (isEditMode ? "edit" : "view") : "create";
  const documentId = id;

  // Initial thicknesses
  const initialThicknesses = [
    0.4, 0.5, 0.6, 0.7, 0.8,
    0.9, 1.0, 1.1, 1.2, 1.3,
    1.4, 1.5, 1.6, 1.7, 1.8
  ];

  // Initialize state with localStorage for create mode
  const [rows, setRows] = useState(() => {
    if (mode === "create") {
      const saved = localStorage.getItem("flakes_draft_rows");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved rows");
        }
      }
    }
    return initialThicknesses.map(t => ({ tebal: t, jumlah: 0 }));
  });

  const [header, setHeader] = useState(() => {
    if (mode === "create") {
      const saved = localStorage.getItem("flakes_draft_header");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved header");
        }
      }
    }
    return {
      tanggal: "",
      jam: "",
      shift: "",
      ukuranPapan: "",
      group: "",
      jarakPisau: "",
      keterangan: "",
      pemeriksa: ""
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode !== "create");

  // Load data for edit/view mode
  useEffect(() => {
    if (mode === "edit" || mode === "view") {
      loadData();
    }
  }, [mode, documentId, isEditMode]);

  // Auto-save draft for create mode
  useEffect(() => {
    if (mode === "create") {
      const timer = setTimeout(() => {
        localStorage.setItem("flakes_draft_header", JSON.stringify(header));
        localStorage.setItem("flakes_draft_rows", JSON.stringify(rows));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [header, rows, mode]);

  const loadData = async () => {
  setIsLoading(true);
  try {
    const res = await fetch(`http://localhost:3001/api/flakes-documents/${documentId}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
        // Set header dengan format tanggal yang benar
        if (data.header) {
        // Format tanggal dari ISO string ke yyyy-MM-dd
        const formatDateForInput = (dateString) => {
            if (!dateString) return "";
            try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
            } catch (e) {
            console.error("Error formatting date:", e);
            return "";
            }
        };

        setHeader({
            tanggal: formatDateForInput(data.header.tanggal),
            jam: data.header.jam || "",
            shift: data.header.shift || "",
            ukuranPapan: data.header.ukuranPapan || "",
            group: data.header.group || "",
            jarakPisau: data.header.jarakPisau || "",
            keterangan: data.header.keterangan || "",
            pemeriksa: data.header.pemeriksa || ""
        });
        }
        
        // Set detail rows
        if (data.detail && Array.isArray(data.detail)) {
        const detailMap = new Map();
        data.detail.forEach(item => {
            detailMap.set(parseFloat(item.tebal), parseInt(item.jumlah) || 0);
        });
        
        const updatedRows = initialThicknesses.map(t => ({
            tebal: t,
            jumlah: detailMap.get(t) || 0
        }));
        
        setRows(updatedRows);
        }
        
    } catch (err) {
        console.error("Error loading ", err);
        alert("❌ Gagal memuat data Flakes");
    } finally {
        setIsLoading(false);
    }
    };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (index, value) => {
    const updated = [...rows];
    const numValue = parseInt(value) || 0;
    updated[index].jumlah = Math.max(0, numValue);
    setRows(updated);
  };

  // Calculations
  const totalJumlah = rows.reduce((a, b) => a + (b.jumlah || 0), 0);
  const grandTotalKetebalan = rows.reduce(
    (a, b) => a + (b.tebal * (b.jumlah || 0)), 0
  );
  const rataRataKetebalan =
    totalJumlah > 0 ? (grandTotalKetebalan / totalJumlah).toFixed(2) : "0.00";

  const validateForm = () => {
    if (!header.tanggal) {
      alert("❌ Mohon isi tanggal");
      return false;
    }
    if (totalJumlah === 0) {
      alert("❌ Mohon isi minimal satu data jumlah flakes");
      return false;
    }
    return true;
  };

  const clearDraft = () => {
    localStorage.removeItem("flakes_draft_header");
    localStorage.removeItem("flakes_draft_rows");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (mode === "view") {
      alert("ℹ️ Anda sedang dalam mode view. Klik tombol Edit untuk mengubah data.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      header,
      detail: rows.filter(r => r.jumlah > 0),
      total_jumlah: totalJumlah,
      grand_total_ketebalan: grandTotalKetebalan,
      rata_rata: rataRataKetebalan
    };

    const url = mode === "edit"
      ? `http://localhost:3001/api/flakes-documents/${documentId}`
      : "http://localhost:3001/api/flakes-documents";

    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Gagal menyimpan");
      }

      alert("✅ Laporan Flakes berhasil disimpan");
      clearDraft();

      navigate(`/lab/pb/admin1/flakes/${responseData.documentId || documentId}`);

    } catch (err) {
      console.error("Submit error:", err);
      alert(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading && mode !== "create") {
    return (
      <div className="flakes-loading-container">
        <div className="spinner-large"></div>
        <p>Memuat data laporan...</p>
      </div>
    );
  }

  return (
    <div className="flakes-container">
      <form onSubmit={handleSubmit} className="flakes-form">
        <h2 className="title">
          {mode === "create" ? "📝 Buat Laporan Baru" : 
           mode === "edit" ? "✏️ Edit Laporan" : "👁️ Detail Laporan"}
        </h2>

        <div className="header-section">
          <div className="header-column">
            <div className="input-group">
              <label>Tanggal <span className="required">*</span></label>
              <input 
                type="date" 
                name="tanggal" 
                value={header.tanggal} 
                onChange={handleHeaderChange}
                disabled={mode === "view"}
                required
              />
            </div>
            <div className="input-group">
              <label>Shift</label>
              <input 
                type="text" 
                name="shift" 
                value={header.shift} 
                onChange={handleHeaderChange}
                disabled={mode === "view"}
                placeholder="Pagi/Siang/Malam"
              />
            </div>
            <div className="input-group">
              <label>Group</label>
              <input 
                type="text" 
                name="group" 
                value={header.group} 
                onChange={handleHeaderChange}
                disabled={mode === "view"}
                placeholder="Group A/B/C"
              />
            </div>
          </div>

          <div className="header-column">
            <div className="input-group">
              <label>Jam</label>
              <input 
                type="time" 
                name="jam" 
                value={header.jam} 
                onChange={handleHeaderChange}
                disabled={mode === "view"}
              />
            </div>
            <div className="input-group">
              <label>Ukuran Papan</label>
              <input 
                type="text" 
                name="ukuranPapan" 
                value={header.ukuranPapan} 
                onChange={handleHeaderChange}
                disabled={mode === "view"}
                placeholder="Contoh: 1220 x 2440 mm"
              />
            </div>
            <div className="input-group">
              <label>Jarak Pisau</label>
              <div className="with-unit">
                <input 
                  type="number" 
                  step="0.01" 
                  name="jarakPisau" 
                  value={header.jarakPisau} 
                  onChange={handleHeaderChange}
                  disabled={mode === "view"}
                  placeholder="0.00"
                />
                <span>mm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="flakes-table">
            <thead>
              <tr>
                <th>Tebal (mm)</th>
                <th>Jumlah</th>
                <th>Total Ketebalan</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="tebal-cell">{row.tebal.toFixed(1)}</td>
                  <td className="jumlah-cell">
                    <input
                      type="number"
                      min="0"
                      value={row.jumlah || ""}
                      onChange={e => handleInputChange(i, e.target.value)}
                      disabled={mode === "view"}
                      placeholder="0"
                    />
                  </td>
                  <td className="total-cell">
                    {(row.tebal * (row.jumlah || 0)).toFixed(1)}
                  </td>
                  {i === 0 && (
                    <td rowSpan={rows.length} className="notes-cell">
                      <textarea
                        name="keterangan"
                        value={header.keterangan}
                        onChange={handleHeaderChange}
                        disabled={mode === "view"}
                        placeholder="Keterangan tambahan..."
                        rows="8"
                      />
                    </td>
                  )}
                </tr>
              ))}
              <tr className="footer-row">
                <td className="footer-label"><strong>JUMLAH</strong></td>
                <td className="footer-value"><strong>{totalJumlah}</strong></td>
                <td className="footer-value"><strong>{grandTotalKetebalan.toFixed(1)}</strong></td>
                <td className="footer-pemeriksa">
                  <div className="pemeriksa-label">Diperiksa oleh:</div>
                  <input
                    type="text"
                    name="pemeriksa"
                    value={header.pemeriksa}
                    onChange={handleHeaderChange}
                    disabled={mode === "view"}
                    placeholder="Nama pemeriksa"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bottom-section">
          <div className="summary-info">
            <div className="summary-item">
              <span className="summary-label">Total Jumlah:</span>
              <span className="summary-value">{totalJumlah}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Rata-rata Ketebalan:</span>
              <span className="summary-value">{rataRataKetebalan} mm</span>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              type="button" 
              className="btn-back" 
              onClick={() => {
                if (mode === "create") {
                  const confirm = window.confirm("Apakah Anda yakin ingin keluar? Data yang belum disimpan akan hilang.");
                  if (confirm) {
                    clearDraft();
                    navigate('/lab/pb/admin1/dokumen');
                  }
                } else {
                  navigate('/lab/pb/admin1/dokumen');
                }
              }}
            >
              ⬅ Kembali ke Daftar
            </button>

            {mode !== "view" && (
              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Menyimpan...
                  </span>
                ) : mode === "edit" ? "💾 Update Laporan" : "📤 Kirim Laporan"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default FlakesForm;