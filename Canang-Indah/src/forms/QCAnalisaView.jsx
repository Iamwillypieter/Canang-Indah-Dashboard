import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function QCAnalisaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/qc-analisa/${id}`);
      const data = await res.json();
      setDocumentData(data);
      
      // Inisialisasi formData dari data yang diambil
      const initialRows = data.rows.map(row => ({
        id: row.id,
        jam: row.jam || "",
        tanggal: row.tanggal || "",
        shift_group: row.shift_group || "",
        material: row.material || "",
        fraction_gt_8: row.fraction_gt_8 || "",
        fraction_gt_4: row.fraction_gt_4 || "",
        fraction_gt_3_15: row.fraction_gt_3_15 || "",
        fraction_gt_2: row.fraction_gt_2 || "",
        fraction_gt_1: row.fraction_gt_1 || "",
        fraction_0_5: row.fraction_0_5 || "",
        fraction_0_25: row.fraction_0_25 || "",
        fraction_lt_0_25: row.fraction_lt_0_25 || "",
        jumlah_gr: row.jumlah_gr || "",
        keterangan: row.keterangan || "",
        diperiksa_oleh: row.diperiksa_oleh || ""
      }));

      setFormData({
        tanggal: data.document.tanggal,
        shift_group: data.document.shift_group,
        rows: initialRows
      });
    } catch (err) {
      console.error("Error fetching document:", err);
      alert("Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("⚠️ Apakah Anda yakin ingin menghapus dokumen ini secara permanen?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/qc-analisa-documents/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Gagal menghapus dokumen");

      alert("✅ Dokumen berhasil dihapus");
      navigate("/lab/pb/admin1/dokumen");
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("❌ Gagal menghapus dokumen");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:3001/api/qc-analisa/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: formData.rows[0]?.tanggal || formData.tanggal,
          shift_group: formData.rows[0]?.shift_group || formData.shift_group,
          rows: formData.rows
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ Berhasil memperbarui data`);
      setIsEditing(false);
      fetchDocument(); // Refresh data untuk sinkronisasi ulang
    } catch (err) {
      console.error("Error updating document:", err);
      alert("❌ Gagal memperbarui data: " + err.message);
    }
  };

  const handleChange = (e, rowIndex) => {
    const { name, value } = e.target;
    const newRows = [...formData.rows];
    newRows[rowIndex][name] = value;
    setFormData({ ...formData, rows: newRows });
  };

  if (loading || !documentData || !formData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h3>Memuat Data...</h3>
      </div>
    );
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '100%',
      margin: '0 auto',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    headerCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: { margin: 0, color: '#1e293b', fontSize: '1.5rem' },
    subtitle: { margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' },
    buttonGroup: { display: 'flex', gap: '10px' },
    button: {
      padding: '10px 18px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    blueBtn: { backgroundColor: '#3b82f6', color: 'white' },
    amberBtn: { backgroundColor: '#f59e0b', color: 'white' },
    redBtn: { backgroundColor: '#ef4444', color: 'white' },
    greenBtn: { backgroundColor: '#10b981', color: 'white' },
    grayBtn: { backgroundColor: '#64748b', color: 'white' },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      overflowX: 'auto',
      maxHeight: '75vh',
      border: '1px solid #e2e8f0'
    },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '1800px' },
    th: {
      backgroundColor: '#f8fafc',
      color: '#475569',
      fontWeight: 'bold',
      fontSize: '12px',
      padding: '12px 8px',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    td: {
      border: '1px solid #e2e8f0',
      fontSize: '13px',
      color: '#334155',
      padding: isEditing ? '2px' : '10px 8px'
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #cbd5e1',
      borderRadius: '4px',
      fontSize: '13px',
      boxSizing: 'border-box',
      textAlign: 'center',
      outlineColor: '#3b82f6'
    },
    standardRow: {
      backgroundColor: '#f1f5f9',
      fontWeight: 'bold',
      fontSize: '11px',
      color: '#64748b'
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.headerCard}>
        <div>
          <h2 style={styles.title}>
            {isEditing ? "📝 Edit Dokumen" : "🔍 View Dokumen"} - {documentData.document.title}
          </h2>
          <p style={styles.subtitle}>
            ID: {id} | Dibuat: {new Date(documentData.document.created_at).toLocaleString('id-ID')}
          </p>
        </div>

        <div style={styles.buttonGroup}>
          {isEditing ? (
            <>
              <button onClick={handleUpdate} style={{...styles.button, ...styles.greenBtn}}>
                💾 Simpan Perubahan
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  fetchDocument(); // Batalkan dan ambil data awal
                }} 
                style={{...styles.button, ...styles.grayBtn}}
              >
                ✖️ Batal
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} style={{...styles.button, ...styles.amberBtn}}>
                ✏️ Edit Data
              </button>
              <button onClick={handleDelete} style={{...styles.button, ...styles.redBtn}}>
                🗑️ Hapus
              </button>
              <button onClick={() => navigate("/lab/pb/admin1/dokumen")} style={{...styles.button, ...styles.blueBtn}}>
                ⬅️ Kembali
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, width: '50px'}}>No</th>
              <th style={{...styles.th, width: '90px'}}>Jam</th>
              <th style={{...styles.th, width: '150px'}}>Tanggal</th>
              <th style={{...styles.th, width: '110px'}}>Shift Group</th>
              <th style={{...styles.th, width: '180px'}}>Material</th>
              <th style={styles.th}>Fraksi &gt;8</th>
              <th style={styles.th}>Fraksi &gt;4</th>
              <th style={styles.th}>Fraksi &gt;3.15</th>
              <th style={styles.th}>Fraksi &gt;2</th>
              <th style={styles.th}>Fraksi &gt;1</th>
              <th style={styles.th}>Fraksi 0.5</th>
              <th style={styles.th}>Fraksi 0.25</th>
              <th style={styles.th}>Fraksi &lt;0.25</th>
              <th style={styles.th}>Total (gr)</th>
              <th style={{...styles.th, width: '200px'}}>Keterangan</th>
              <th style={{...styles.th, width: '150px'}}>Pemeriksa</th>
            </tr>
          </thead>
          <tbody>
            {/* Standard Rows (Informational) */}
            <tr style={styles.standardRow}>
              <td colSpan="5" style={{ padding: '10px', textAlign: 'center' }}>STANDARD ABSL</td>
              {[0, "0-1", "0-5", "0-10", "0.5-20", "15-45", "25-60", "<20"].map((v, i) => (
                <td key={i} style={{textAlign: 'center'}}>{v}</td>
              ))}
              <td colSpan="3"></td>
            </tr>
            <tr style={styles.standardRow}>
              <td colSpan="5" style={{ padding: '10px', textAlign: 'center' }}>STANDARD ABCL</td>
              {["0-5", "0-10", "2-20", "15-35", "20-50", "18-40", "3-10", "<5"].map((v, i) => (
                <td key={i} style={{textAlign: 'center'}}>{v}</td>
              ))}
              <td colSpan="3"></td>
            </tr>

            {/* Content Rows */}
            {formData.rows.map((row, index) => (
              <tr key={row.id || index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fcfcfc' }}>
                <td style={{...styles.td, textAlign: 'center', backgroundColor: '#f1f5f9', fontWeight: 'bold'}}>
                  {index + 1}
                </td>
                
                {/* Editable Fields Logic */}
                <td style={styles.td}>
                  {isEditing ? (
                    <input type="text" name="jam" value={row.jam} onChange={(e) => handleChange(e, index)} style={styles.input} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>{row.jam || '-'}</div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <input type="date" name="tanggal" value={row.tanggal} onChange={(e) => handleChange(e, index)} style={styles.input} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>{row.tanggal || '-'}</div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <select 
                      name="shift_group" 
                      value={row.shift_group} 
                      onChange={(e) => handleChange(e, index)} 
                      style={{...styles.input, appearance: 'auto'}}
                    >
                      <option value="">Pilih</option>
                      <option value="Shift A">Shift A</option>
                      <option value="Shift B">Shift B</option>
                      <option value="Shift C">Shift C</option>
                    </select>
                  ) : (
                    <div style={{ textAlign: 'center' }}>{row.shift_group || '-'}</div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <input type="text" name="material" value={row.material} onChange={(e) => handleChange(e, index)} style={{...styles.input, textAlign: 'left'}} />
                  ) : (
                    <div style={{ textAlign: 'left', fontWeight: '500' }}>{row.material || '-'}</div>
                  )}
                </td>

                {/* Numeric/Fraction Fields */}
                {['fraction_gt_8', 'fraction_gt_4', 'fraction_gt_3_15', 'fraction_gt_2', 'fraction_gt_1', 'fraction_0_5', 'fraction_0_25', 'fraction_lt_0_25', 'jumlah_gr'].map((field) => (
                  <td key={field} style={styles.td}>
                    {isEditing ? (
                      <input type="text" name={field} value={row[field]} onChange={(e) => handleChange(e, index)} style={styles.input} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>{row[field] || '0'}</div>
                    )}
                  </td>
                ))}

                <td style={styles.td}>
                  {isEditing ? (
                    <input type="text" name="keterangan" value={row.keterangan} onChange={(e) => handleChange(e, index)} style={{...styles.input, textAlign: 'left'}} />
                  ) : (
                    <div style={{ textAlign: 'left' }}>{row.keterangan || '-'}</div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <input type="text" name="diperiksa_oleh" value={row.diperiksa_oleh} onChange={(e) => handleChange(e, index)} style={{...styles.input, textAlign: 'left'}} />
                  ) : (
                    <div style={{ textAlign: 'left' }}>{row.diperiksa_oleh || '-'}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}