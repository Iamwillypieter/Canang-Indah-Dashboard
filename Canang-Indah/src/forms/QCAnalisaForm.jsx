import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QCAnalisaTable from "../components/QCAnalisaTable.jsx";
import QCAnalisaHeader from "../components/QCAnalisaHeader.jsx";

const STORAGE_KEY = "qcAnalisaScreenDraft";

const getInitialData = () => ({
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
});

export default function QCAnalisaForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : getInitialData();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

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
    <div style={styles.container}>
      <QCAnalisaHeader />
      
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