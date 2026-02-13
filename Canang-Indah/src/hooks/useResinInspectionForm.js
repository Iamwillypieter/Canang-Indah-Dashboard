import { useState, useEffect } from "react";

const STORAGE_KEY = "resinInspectionForm";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function useResinInspectionForm() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          date: "",
          shift: "",
          group: "",
          comment_by: "",
          createdBy: "",
          inspection: Array(4).fill().map(() => ({
            certTestNo: "",
            resinTank: "",
            quantity: "",
            specificGravity: "",
            viscosity: "",
            ph: "",
            gelTime: "",
            waterTolerance: "",
            appearance: "",
            solids: "",
          })),
          solidContent: Array(4).fill().map((_, idx) => ({
            sampleTime: `${idx + 1}`,
            rows: Array(3).fill().map(() => ({
              alumFoilNo: "",
              wtAlumFoil: "",
              wtGlue: "",
              wtAlumFoilDryGlue: "",
              wtDryGlue: "",
              solidsContent: "",
              remark: "",
            }))
          }))
        };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInspectionChange = (i, field, value) => {
    const inspection = [...formData.inspection];
    inspection[i][field] = value;
    setFormData({ ...formData, inspection });
  };

  const handleSolidChange = (sIdx, rIdx, field, value) => {
    const solidContent = [...formData.solidContent];
    solidContent[sIdx].rows[rIdx][field] = value;
    setFormData({ ...formData, solidContent });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_BASE}/resin-inspection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menyimpan data");
      }

      const data = await res.json();
      alert("✅ Data Resin Inspection berhasil disimpan!");
      
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch (err) {
      console.error('Submit error:', err);
      alert("❌ " + (err.message || "Terjadi kesalahan saat menyimpan"));
    }
  };

  const clearForm = () => {
    if (!window.confirm("Hapus semua data form?")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return {
    formData,
    handleChange,
    handleInspectionChange,
    handleSolidChange,
    handleSubmit,
    clearForm
  };
}