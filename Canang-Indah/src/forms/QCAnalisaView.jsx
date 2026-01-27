import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function QCAnalisaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/qc-analisa/${id}`);
      const data = await res.json();
      setDocumentData(data);
      
      // Siapkan formData untuk edit mode
      setFormData({
        tanggal: data.document.tanggal,
        shift_group: data.document.shift_group,
        rows: data.rows.map(row => ({
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
        }))
      });
    } catch (err) {
      console.error("Error fetching document:", err);
      alert("Gagal memuat dokumen");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) {
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
          tanggal: formData.rows[0].tanggal,
          shift_group: formData.rows[0].shift_group,
          rows: formData.rows
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ ${data.count} baris berhasil diperbarui`);
      setIsEditing(false);
      fetchDocument(); // Refresh data

    } catch (err) {
      console.error("Error updating document:", err);
      alert("❌ Gagal memperbarui data");
    }
  };

  const handleChange = (e, rowIndex) => {
    const { name, value } = e.target;
    const newRows = [...formData.rows];
    newRows[rowIndex][name] = value;
    setFormData({ ...formData, rows: newRows });
  };

  if (!documentData || !formData) {
    return <div>Loading...</div>;
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '100%',
      margin: '0 auto',
      fontFamily: 'sans-serif'
    },
    header: {
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px'
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    viewButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    editButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    saveButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    cancelButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '1600px'
    },
    th: {
      backgroundColor: '#f1f5f9',
      color: '#475569',
      fontWeight: '600',
      fontSize: '12px',
      padding: '10px 5px',
      border: '1px solid #cbd5e1',
      textAlign: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    td: {
      border: '1px solid #cbd5e1',
      padding: '0'
    },
    input: {
      width: '100%',
      padding: '8px 4px',
      border: 'none',
      outline: 'none',
      fontSize: '12px',
      backgroundColor: 'transparent',
      textAlign: 'center'
    },
    standardRow: {
      backgroundColor: '#f8fafc',
      fontWeight: 'bold',
      fontSize: '11px',
      textAlign: 'center',
      color: '#475569'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>🔍 QC Analisa - {documentData.document.title}</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            Dibuat: {new Date(documentData.document.created_at).toLocaleString()}
          </p>
        </div>
        <div style={styles.buttonGroup}>
          {isEditing ? (
            <>
              <button 
                type="button" 
                onClick={handleUpdate}
                style={{...styles.button, ...styles.saveButton}}
              >
                Simpan Perubahan
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  fetchDocument(); // Reset ke data original
                }}
                style={{...styles.button, ...styles.cancelButton}}
              >
                Batal
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                style={{...styles.button, ...styles.editButton}}
              >
                ✏️ Edit
              </button>
              <button 
                onClick={handleDelete}
                style={{...styles.button, ...styles.deleteButton}}
              >
                🗑 Hapus
              </button>
              <button 
                onClick={() => navigate("/lab/pb/admin1/dokumen")}
                style={{...styles.button, ...styles.viewButton}}
              >
                ← Kembali
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ 
        overflowX: 'auto', 
        maxHeight: '70vh',
        border: '1px solid #cbd5e1',
        borderRadius: '8px'
      }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, width: '40px'}}>No</th>
              <th style={{...styles.th, width: '80px'}}>Jam</th>
              <th style={{...styles.th, width: '130px'}}>Tanggal</th>
              <th style={{...styles.th, width: '100px'}}>Shift Group</th>
              <th style={{...styles.th, width: '150px'}}>Material</th>
              <th style={styles.th}>Fraksi &gt;8</th>
              <th style={styles.th}>Fraksi &gt;4</th>
              <th style={styles.th}>Fraksi &gt;3.15</th>
              <th style={styles.th}>Fraksi &gt;2</th>
              <th style={styles.th}>Fraksi &gt;1</th>
              <th style={styles.th}>Fraksi 0.5</th>
              <th style={styles.th}>Fraksi 0.25</th>
              <th style={styles.th}>Fraksi &lt;0.25</th>
              <th style={styles.th}>Total (gr)</th>
              <th style={styles.th}>Keterangan</th>
              <th style={styles.th}>Pemeriksa</th>
            </tr>
          </thead>
          <tbody>
            {/* Standard ABSL */}
            <tr style={styles.standardRow}>
              <td colSpan="5" style={{ padding: '8px' }}>STANDARD ABSL</td>
              <td>0</td><td>0-1</td><td>0-5</td><td>0-10</td><td>0.5-20</td><td>15-45</td><td>25-60</td><td>&lt;20</td>
              <td colSpan="3"></td>
            </tr>
            {/* Standard ABCL */}
            <tr style={styles.standardRow}>
              <td colSpan="5" style={{ padding: '8px' }}>STANDARD ABCL</td>
              <td>0-5</td><td>0-10</td><td>2-20</td><td>15-35</td><td>20-50</td><td>18-40</td><td>3-10</td><td>&lt;5</td>
              <td colSpan="3"></td>
            </tr>

            {/* Data Rows */}
            {formData.rows.map((row, index) => (
              <tr key={row.id || index}>
                <td style={{...styles.td, textAlign: 'center', backgroundColor: '#f1f5f9'}}>
                  {row.id || index + 1}
                </td>
                
                <td style={styles.td}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="jam" 
                      value={row.jam} 
                      onChange={(e) => handleChange(e, index)} 
                      style={styles.input} 
                    />
                  ) : (
                    <div style={{ padding: '8px 4px', textAlign: 'center' }}>{row.jam || '-'}</div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <input 
                      type="date" 
                      name="tanggal" 
                      value={row.tanggal} 
                      onChange={(e) => handleChange(e, index)} 
                      style={styles.input} 
                    />
                  ) : (
                    <div style={{ padding: '8px 4px', textAlign: 'center' }}>
                      {row.tanggal || '-'}
                    </div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <select 
                      name="shift_group" 
                      value={row.shift_group} 
                      onChange={(e) => handleChange(e, index)} 
                      style={{...styles.input, appearance: 'none'}}
                    >
                      <option>Shift A</option>
                      <option>Shift B</option>
                      <option>Shift C</option>
                    </select>
                  ) : (
                    <div style={{ padding: '8px 4px', textAlign: 'center' }}>
                      {row.shift_group || '-'}
                    </div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="material" 
                      value={row.material} 
                      onChange={(e) => handleChange(e, index)} 
                      style={{...styles.input, textAlign: 'left'}} 
                    />
                  ) : (
                    <div style={{ padding: '8px 4px', textAlign: 'left' }}>
                      {row.material || '-'}
                    </div>
                  )}
                </td>

                {/* Fraksi & Total (gr) */}
                {['fraction_gt_8', 'fraction_gt_4', 'fraction_gt_3_15', 'fraction_gt_2', 'fraction_gt_1', 'fraction_0_5', 'fraction_0_25', 'fraction_lt_0_25', 'jumlah_gr'].map((field) => (
                  <td key={field} style={styles.td}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name={field} 
                        value={row[field]} 
                        onChange={(e) => handleChange(e, index)} 
                        style={styles.input} 
                      />
                    ) : (
                      <div style={{ padding: '8px 4px', textAlign: 'center' }}>
                        {row[field] || '-'}
                      </div>
                    )}
                  </td>
                ))}

                <td style={styles.td}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="keterangan" 
                      value={row.keterangan} 
                      onChange={(e) => handleChange(e, index)} 
                      style={{...styles.input, textAlign: 'left'}} 
                    />
                  ) : (
                    <div style={{ padding: '8px 4px', textAlign: 'left' }}>
                      {row.keterangan || '-'}
                    </div>
                  )}
                </td>

                <td style={styles.td}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="diperiksa_oleh" 
                      value={row.diperiksa_oleh} 
                      onChange={(e) => handleChange(e, index)} 
                      style={{...styles.input, textAlign: 'left'}} 
                    />
                  ) : (
                    <div style={{ padding: '8px 4px', textAlign: 'left' }}>
                      {row.diperiksa_oleh || '-'}
                    </div>
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