import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFlakesForm } from "../hooks/useFlakesForm.js";
import "./FlakesForm.css";

const FlakesForm = ({ isEditMode = false, userInfo = null }) => {
  // 👈 Tambah prop userInfo untuk terima data user dari auth context
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
    navigate,
    userInfo // 👈 Pass userInfo ke hook
  });

  // 🎯 Auto-fill shift & group dari userInfo saat mode create
  useEffect(() => {
    if (mode === "create") {
      // ✅ Ambil shift: prioritaskan userInfo, fallback ke localStorage, terakhir ke default
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const finalShift = 
        (userInfo?.shift && userInfo.shift.trim() !== "") ? userInfo.shift.trim() :
        (savedUser?.shift && savedUser.shift.trim() !== "") ? savedUser.shift.trim() :
        "";
        
      const finalGroup = 
        userInfo?.group !== undefined ? (userInfo.group || "") :
        (savedUser?.group !== undefined ? savedUser.group : "");

      if (finalShift) {
        setHeader(prev => ({
          ...prev,
          shift: finalShift,
          group: finalGroup
        }));
        console.log("✅ Auto-filled header:", { shift: finalShift, group: finalGroup });
      }
    }
  }, [mode, userInfo, setHeader]);

  useEffect(() => {
    if (mode === "create") {
      console.log("🔍 [FlakesForm Debug]");
      console.log("  - userInfo prop:", userInfo);
      console.log("  - header.shift:", header.shift);
      console.log("  - header.group:", header.group);
    }
  }, [mode, userInfo, header]);

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

        {/* 🎯 INFO USER SHIFT - Hanya tampil di create mode */}
        {mode === "create" && userInfo && (
          <div className="user-info-banner">
            👤 <strong>{userInfo.name}</strong> — Shift {userInfo.shift}{userInfo.group}
          </div>
        )}

        <div className="header-section">
          <div className="header-column">
            
            {/* 🎯 TAG NAME - AUTO GENERATED (Display Only) */}
            <div className="input-group">
              <label>Tag Name Document</label>
              {mode === "create" ? (
                // ➕ Mode Create: Tampilkan preview format dengan shift/group dari user
                <div className="tag-preview">
                  <span className="tag-placeholder">
                    Akan digenerate otomatis:
                  </span>
                  <code className="tag-example">
                    FLAKES 0001 {userInfo?.shift || "1A"}{userInfo?.group || ""} {header.tanggal ? new Date(header.tanggal).toLocaleDateString('id-ID').replace(/\//g,'') : "DDMMYYYY"} HH.MM
                  </code>
                </div>
              ) : (
                // ✏️👁️ Mode Edit/View: Tampilkan tag_name dari data
                <input
                  type="text"
                  value={header.tagName || "-"}
                  disabled
                  className="readonly-tag"
                  style={{ 
                    fontWeight: 'bold', 
                    backgroundColor: '#f8fafc',
                    borderColor: '#0ea5e9' 
                  }}
                />
              )}
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

            {/* ❌ SHIFT & GROUP DIHAPUS DARI UI CREATE MODE */}
            {/* Tapi tetap ditampilkan readonly di Edit/View mode untuk info */}
            {mode !== "create" && (
              <>
                <div className="input-group">
                  <label>Shift</label>
                  <input
                    type="text"
                    value={header.shift || "-"}
                    disabled
                    className="readonly-field"
                  />
                </div>

                <div className="input-group">
                  <label>Group</label>
                  <input
                    type="text"
                    value={header.group || "-"}
                    disabled
                    className="readonly-field"
                  />
                </div>
              </>
            )}

          </div>

          <div className="header-column">
            
            {/* ⚠️ JAM JUGA HANYA TAMPIL DI EDIT/VIEW MODE */}
            {mode !== "create" && (
              <div className="input-group">
                <label>Jam</label>
                <input
                  type="text"
                  value={header.jam?.substring(0, 5) || "-"}
                  disabled
                  className="readonly-field"
                />
              </div>
            )}
            
            {mode === "create" && (
              <div className="input-group">
                <label>Jam</label>
                <div className="tag-preview">
                  <span className="tag-placeholder">Diisi otomatis saat submit</span>
                </div>
              </div>
            )}

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