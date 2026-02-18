import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const TOTAL_ROWS = 32;

const createEmptyRow = (index) => ({
  id: `empty-${index}`,
  jam: "",
  tanggal: "",
  shift_group: "",
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
});

export default function QCAnalisaView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_BASE}/qc-analisa/${id}`, {
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

      setDocumentData(data);

      // === DATA DARI SERVER ===
      const serverRows = data.rows.map((row, index) => ({
        id: row.id || `row-${index}`,
        jam: row.jam || "",
        tanggal: row.tanggal || data.document.tanggal || "",
        shift_group: row.shift_group || data.document.shift_group || "",
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

      const filledRows = [...serverRows];
      for (let i = serverRows.length; i < TOTAL_ROWS; i++) {
        filledRows.push(createEmptyRow(i));
      }

      setFormData({
        tanggal: data.document.tanggal,
        shift_group: data.document.shift_group,
        rows: filledRows
      });
    } catch (err) {
      console.error('Fetch document error:', err);
      alert("❌ " + (err.message || "Gagal memuat dokumen"));
      navigate("/lab/pb/admin1/dokumen");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, rowIndex) => {
    const { name, value } = e.target;
    const rows = [...formData.rows];
    rows[rowIndex][name] = value;
    setFormData({ ...formData, rows });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const filteredRows = formData.rows.filter(
      (r) => r.material || r.jam || r.jumlah_gr || r.keterangan || r.diperiksa_oleh
    );

    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_BASE}/qc-analisa/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          tag_name: documentData.document.tag_name,  // 👈 Kirim tag_name
          tanggal: formData.tanggal,
          shift_group: formData.shift_group,
          rows: filteredRows
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Update gagal");
      }

      alert("✅ Data berhasil diperbarui");
      setIsEditing(false);
      fetchDocument();
    } catch (err) {
      console.error('Update error:', err);
      alert("❌ " + (err.message || "Gagal update"));
    }
  };

  if (loading || !formData || !documentData) {
    return <h3 style={{ textAlign: "center" }}>Memuat data...</h3>;
  }

  const styles = {
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      padding: "14px 18px",
      background: "#ffffff",
      borderRadius: 10,
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
    },
    title: {
      margin: 0,
      fontSize: 22,
      fontWeight: 700,
      color: "#0f172a"
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: "#64748b"
    },
    buttonGroup: {
      display: "flex",
      gap: 12
    },
    btn: {
      padding: "10px 20px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 8,
      transition: "all 0.2s ease",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
    },
    primary: {
      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
      color: "#fff"
    },
    warning: {
      background: "linear-gradient(135deg, #f59e0b, #d97706)",
      color: "#fff"
    },
    success: {
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      color: "#fff"
    },
    ghost: {
      background: "#f8fafc",
      color: "#334155",
      border: "1px solid #cbd5e1",
      boxShadow: "none"
    },
    editBadge: {
      padding: "4px 10px",
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 999,
      background: "#fee2e2",
      color: "#b91c1c",
      marginLeft: 10
    },
    viewBadge: {
      padding: "4px 10px",
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 999,
      background: "#e0f2fe",
      color: "#0369a1",
      marginLeft: 10
    }
  };


  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            QC Analisa – {documentData.document.title}
            
            {/* 👇 TAMBAHKAN BADGE TAG NAME */}
            {documentData.document.tag_name && (
              <span style={{
                ...styles.viewBadge,
                background: "#dbeafe",
                color: "#1e40af",
                marginLeft: 12
              }}>
                🏷️ {documentData.document.tag_name}
              </span>
            )}
            
            {isEditing ? (
              <span style={styles.editBadge}>EDIT MODE</span>
            ) : (
              <span style={styles.viewBadge}>VIEW MODE</span>
            )}
          </h2>
          <div style={styles.subtitle}>
            Document ID: {id} • 
            Tanggal: {documentData.document.tanggal} • 
            Shift: {documentData.document.shift_group}
          </div>
        </div>

        <div style={styles.buttonGroup}>
          {isEditing ? (
            <>
              <button
                style={{ ...styles.btn, ...styles.success }}
                onClick={handleUpdate}
              >
                💾 Simpan Perubahan
              </button>

              <button
                style={{ ...styles.btn, ...styles.ghost }}
                onClick={() => {
                  setIsEditing(false);
                  fetchDocument();
                }}
              >
                ✖ Batal
              </button>
            </>
          ) : (
            <>
              <button
                style={{ ...styles.btn, ...styles.warning }}
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Data
              </button>

              <button
                style={{ ...styles.btn, ...styles.ghost }}
                onClick={() => navigate("/lab/pb/admin1/dokumen")}
              >
                ⬅ Kembali
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ overflowX: "auto", marginTop: 20 }}>
        <table border="1" cellPadding="5" style={{ minWidth: 1800 }}>
          <thead>
            <tr>
              <th>No</th>
              <th>Jam</th>
              <th>Tanggal</th>
              <th>Shift</th>
              <th>Material</th>
              {[
                ">8", ">4", ">3.15", ">2", ">1",
                "0.5", "0.25", "<0.25", "Total"
              ].map((h) => <th key={h}>{h}</th>)}
              <th>Keterangan</th>
              <th>Pemeriksa</th>
            </tr>
          </thead>

          <tbody>
            {formData.rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>

                {[
                  "jam",
                  "tanggal",
                  "shift_group",
                  "material",
                  "fraction_gt_8",
                  "fraction_gt_4",
                  "fraction_gt_3_15",
                  "fraction_gt_2",
                  "fraction_gt_1",
                  "fraction_0_5",
                  "fraction_0_25",
                  "fraction_lt_0_25",
                  "jumlah_gr",
                  "keterangan",
                  "diperiksa_oleh"
                ].map((field) => (
                  <td key={field}>
                    {isEditing ? (
                      <input
                        value={row[field]}
                        name={field}
                        onChange={(e) => handleChange(e, index)}
                      />
                    ) : (
                      row[field] || "-"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}