import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFlakesForm } from "../hooks/useFlakesForm.js";
import "./FlakesForm.css";

const FlakesForm = ({ isEditMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const mode = id ? (isEditMode ? "edit" : "view") : "create";

  const {
    rows,
    setRows,
    header,
    setHeader,
    isLoading,
    isSubmitting,
    totalJumlah,
    grandTotalKetebalan,
    rataRata,
    handleSubmit
  } = useFlakesForm({
    mode,
    documentId: id,
    navigate
  });

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (index, value) => {
    const updated = [...rows];
    updated[index].jumlah = Math.max(0, parseInt(value) || 0);
    setRows(updated);
  };

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
      <form
        className="flakes-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <h2 className="title">
          {mode === "create"
            ? "📝 Buat Laporan Baru"
            : mode === "edit"
            ? "✏️ Edit Laporan"
            : "👁️ Detail Laporan"}
        </h2>

        <div className="header-section">
          <div className="header-column">
            <div className="input-group">
              <label>Tag Name Document *</label>
              <input
                type="text"
                name="tagName"
                value={header.tagName || ""}
                onChange={handleHeaderChange}
                disabled={mode === "view"}
                placeholder="Contoh: 1A, 1B, 0001"
                style={{ fontWeight: 'bold', borderColor: '#0ea5e9' }}
              />
            </div>

            <div className="input-group">
              <label>Tanggal *</label>
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
                placeholder="Pagi / Siang / Malam"
              />
            </div>
          </div>

          <div className="header-column">
            <div className="input-group">
              <label>Group</label>
              <input
                type="text"
                name="group"
                value={header.group}
                onChange={handleHeaderChange}
                disabled={mode === "view"}
                placeholder="Group A / B / C"
              />
            </div>

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
                placeholder="1220 x 2440 mm"
              />
            </div>

            <div className="input-group">
              <label>Jarak Pisau</label>
              <div className="with-unit">
                <input
                  type="text"
                  name="jarakPisau"
                  value={header.jarakPisau}
                  onChange={handleHeaderChange}
                  disabled={mode === "view"}
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
                      onChange={(e) =>
                        handleInputChange(i, e.target.value)
                      }
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
                        rows="8"
                        placeholder="Keterangan tambahan..."
                      />
                    </td>
                  )}
                </tr>
              ))}

              <tr className="footer-row">
                <td><strong>JUMLAH</strong></td>
                <td><strong>{totalJumlah}</strong></td>
                <td>
                  <strong>
                    {grandTotalKetebalan.toFixed(1)}
                  </strong>
                </td>
                <td>
                  <div className="pemeriksa-label">
                    Diperiksa oleh:
                  </div>
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
            <div>
              <span>Total Jumlah:</span>
              <strong>{totalJumlah}</strong>
            </div>
            <div>
              <span>Rata-rata Ketebalan:</span>
              <strong>{rataRata} mm</strong>
            </div>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="btn-back"
              onClick={() =>
                navigate("/lab/pb/admin1/dokumen")
              }
            >
              ⬅ Kembali ke Daftar
            </button>

            {mode !== "view" && (
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : mode === "edit"
                  ? "💾 Update Laporan"
                  : "📤 Kirim Laporan"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default FlakesForm;