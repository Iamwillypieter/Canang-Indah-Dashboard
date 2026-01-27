import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "qcAnalisaScreenDraft";

export default function QCAnalisaForm() {
const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          tanggalDefault: new Date().toISOString().split("T")[0],
          shiftDefault: "Shift A",
          rows: Array(32).fill().map((_, i) => ({
            id: i + 1,
            jam: "",
            tanggal: new Date().toISOString().split("T")[0],
            shift_group: "Shift A",
            material: "",
            fraction_gt_8: "",
            fraction_gt_4: "",
            fraction_gt_3_15: "",
            fraction_gt_2: "",
            fraction_gt_1: "",
            fraction_0_5: "",
            fraction_0_25: "",
            fraction_lt_0_25: "",
            jumlah_gr: "",
            keterangan: "",
            diperiksa_oleh: ""
          }))
        };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);



  const styles = {
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

  const handleChange = (e, rowIndex) => {
    const { name, value } = e.target;
    const newRows = [...formData.rows];
    newRows[rowIndex][name] = value;
    setFormData({ ...formData, rows: newRows });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3001/api/qc-analisa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: formData.rows[0].tanggal,
          shift_group: formData.rows[0].shift_group,
          rows: formData.rows
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.removeItem(STORAGE_KEY);
      alert(`✅ ${data.count} baris berhasil disimpan`);

      navigate("/lab/pb/admin1/dokumen");

    } catch (err) {
      alert("❌ Gagal simpan data");
    }
  };


  return (
    <div style={{ padding: '20px', maxWidth: '100%', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>🔍 Quality Control Analisa Screen</h2>
        <p style={{ color: '#64748b' }}>Input data per baris secara mendetail</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ 
          overflowX: 'auto', 
          maxHeight: '70vh', // User bisa scroll tabelnya saja
          border: '1px solid #cbd5e1',
          borderRadius: '8px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1600px' }}>
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
                <tr key={index}>
                  <td style={{...styles.td, textAlign: 'center', backgroundColor: '#f1f5f9'}}>{row.id}</td>
                  
                  {/* Kolom Jam */}
                  <td style={styles.td}>
                    <input type="text" name="jam" value={row.jam} onChange={(e) => handleChange(e, index)} placeholder="" style={styles.input} />
                  </td>

                  {/* Kolom Tanggal */}
                  <td style={styles.td}>
                    <input type="date" name="tanggal" value={row.tanggal} onChange={(e) => handleChange(e, index)} style={styles.input} />
                  </td>

                  {/* Kolom Shift Group */}
                  <td style={styles.td}>
                    <select name="shift_group" value={row.shift_group} onChange={(e) => handleChange(e, index)} style={{...styles.input, appearance: 'none'}}>
                      <option>Shift A</option>
                      <option>Shift B</option>
                      <option>Shift C</option>
                    </select>
                  </td>

                  {/* Kolom Material */}
                  <td style={styles.td}>
                    <input type="text" name="material" value={row.material} onChange={(e) => handleChange(e, index)} placeholder="" style={{...styles.input, textAlign: 'left'}} />
                  </td>

                  {/* Fraksi & Total (gr) - kombinasi angka & huruf */}
                  {['fraction_gt_8', 'fraction_gt_4', 'fraction_gt_3_15', 'fraction_gt_2', 'fraction_gt_1', 'fraction_0_5', 'fraction_0_25', 'fraction_lt_0_25', 'jumlah_gr'].map((field) => (
                  <td key={field} style={styles.td}>
                    <input 
                        type="text" 
                        name={field} 
                        value={row[field]} 
                        onChange={(e) => handleChange(e, index)} 
                        style={styles.input} 
                        placeholder={
                            field === 'jumlah_gr' 
                            ? '' 
                            : ''
                    }
                        />
                    </td>
                    ))}
                  {/* Keterangan & Pemeriksa */}
                  <td style={styles.td}>
                    <input type="text" name="keterangan" value={row.keterangan} onChange={(e) => handleChange(e, index)} style={{...styles.input, textAlign: 'left'}} />
                  </td>
                  <td style={styles.td}>
                    <input type="text" name="diperiksa_oleh" value={row.diperiksa_oleh} onChange={(e) => handleChange(e, index)} style={{...styles.input, textAlign: 'left'}} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            Simpan Data Analisa
          </button>
        </div>
      </form>
    </div>
  );
}