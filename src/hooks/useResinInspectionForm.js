import { useState, useEffect } from "react";

const STORAGE_KEY = "resinInspectionForm";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function useResinInspectionForm() {
  // 👇 STATE: formData dengan tagName
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          tagName: "",              // 👈 Tambahkan field tagName
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

  // 👇 Auto-save ke localStorage (termasuk tagName)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const getAuthToken = () => localStorage.getItem('token');

  // 👇 handleChange sudah otomatis support tagName karena pakai [name]: value
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
    // 👇 HAPUS: setIsSubmitting?.(true) karena nggak ada di hook ini
    
    try {
      const token = getAuthToken();
      
      // 👇 LOG: Debug payload (cek di Console Browser)
      console.log('📦 Payload yang dikirim:', {
        tag_name: formData.tagName,
        date: formData.date,
        shift: formData.shift,
        group: formData.group,
        comment_by: formData.comment_by,
        createdBy: formData.createdBy,
        inspection_count: formData.inspection?.length,
        solidContent_count: formData.solidContent?.length
      });

      // 👇 Payload: pastikan naming sesuai backend (camelCase)
      const payload = {
        tag_name: formData.tagName?.trim() || null,  // snake_case untuk DB
        date: formData.date,
        shift: formData.shift,
        group: formData.group,
        comment_by: formData.comment_by,
        createdBy: formData.createdBy,        // 👈 camelCase
        inspection: formData.inspection,
        solidContent: formData.solidContent   // 👈 camelCase (PENTING!)
      };

      const res = await fetch(`${API_BASE}/resin-inspection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(async () => ({ raw: await res.text() }));
        console.error('❌ Backend Error Response:', errorData);
        
        const errorMsg = errorData.error || errorData.message || JSON.stringify(errorData);
        throw new Error(`Backend error: ${errorMsg}`);
      }

      const data = await res.json();
      alert("✅ Data Resin Inspection berhasil disimpan!");
      
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "/lab/pb/admin1/dokumen";
      
    } catch (err) {
      console.error('💥 Submit error details:', {
        message: err.message,
        stack: err.stack
      });
      alert(`❌ Gagal menyimpan: ${err.message}`);
    }
    // 👇 HAPUS: setIsSubmitting?.(false)
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