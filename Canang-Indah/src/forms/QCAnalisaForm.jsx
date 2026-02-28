import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QCAnalisaTable from "../components/QCAnalisaTable.jsx";
import QCAnalisaHeader from "../components/QCAnalisaHeader.jsx";

const STORAGE_KEY = "qcAnalisaScreenDraft";
const API_BASE = import.meta.env.VITE_API_URL + "/api";

const getInitialData = () => ({
  tagName: "", // 👈 Tambahkan field tagName di awal
  tanggalDefault: new Date().toISOString().split("T")[0],
  shiftDefault: "Shift A",
  rows: Array(32).fill().map((_, i) => ({
    id: i + 1,
    jam: "",
    tanggal: new Date().toISOString().split("T")[0],
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
  }))
});

export default function QCAnalisaForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : getInitialData();
  });

  // Auto-save ke localStorage termasuk tagName
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const getAuthToken = () => localStorage.getItem('token');

  // Handle perubahan input di table (jam, material, dll)
  const handleChange = (e, rowIndex) => {
    const { name, value } = e.target;
    const newRows = [...formData.rows];
    newRows[rowIndex][name] = value;
    setFormData({ ...formData, rows: newRows });
  };

  // 👇 Handle khusus untuk tagName dari Header
  const handleTagNameChange = (value) => {
    setFormData(prev => ({ ...prev, tagName: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_BASE}/qc-analisa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          tag_name: formData.tagName, // 👈 Kirim tagName ke backend
          tanggal: formData.rows[0]?.tanggal,
          shift_group: formData.rows[0]?.shift_group,
          rows: formData.rows
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menyimpan data");
      }

      const data = await res.json();
      localStorage.removeItem(STORAGE_KEY);
      alert(`✅ ${data.count || formData.rows.length} baris berhasil disimpan`);
      navigate("/lab/pb/admin1/dokumen");

    } catch (err) {
      console.error('Submit error:', err);
      alert("❌ " + (err.message || "Gagal menyimpan data"));
    }
  };

  return (
    <div style={styles.container}>
      {/* 👇 Pass tagName dan onTagChange ke Header */}
      <QCAnalisaHeader 
        tagName={formData.tagName} 
        onTagChange={handleTagNameChange} 
      />
      
      <form onSubmit={handleSubmit}>
        <QCAnalisaTable 
          rows={formData.rows} 
          onChange={handleChange} 
        />
        
        <div style={styles.submitContainer}>
          <button type="submit" style={styles.submitButton}>
            Kirim
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '100%',
    margin: '0 auto',
    fontFamily: 'sans-serif'
  },
  submitContainer: {
    marginTop: '20px',
    textAlign: 'right'
  },
  submitButton: {
    padding: '12px 25px',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};