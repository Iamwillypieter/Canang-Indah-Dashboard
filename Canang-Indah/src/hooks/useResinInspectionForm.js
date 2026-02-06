import { useState, useEffect } from "react";

const STORAGE_KEY = "resinInspectionForm";

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

  // ✅ AUTO SAVE (INI YANG KAMU MAU)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

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
      const res = await fetch("http://localhost:3001/api/resin-inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Gagal simpan");

      alert("✅ Data Resin Inspection berhasil disimpan!");
      // ❌ TIDAK remove localStorage
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // 🔥 CLEAR MANUAL (OPTIONAL)
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
