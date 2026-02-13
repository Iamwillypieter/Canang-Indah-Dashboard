import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ResinInspectionView.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function ResinInspectionView() {
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
      
      const res = await fetch(`${API_BASE}/resin-inspection/${id}`, {
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

      setFormData({
        date: data.document.date,
        shift: data.document.shift,
        group: data.document.group_name,
        comment_by: data.document.comment_by || "",
        createdBy: data.document.created_by || "",
        inspection: data.inspection.map(row => ({
          id: row.id,
          certTestNo: row.cert_test_no || "",
          resinTank: row.resin_tank || "",
          quantity: row.quantity || "",
          specificGravity: row.specific_gravity || "",
          viscosity: row.viscosity || "",
          ph: row.ph || "",
          gelTime: row.gel_time || "",
          waterTolerance: row.water_tolerance || "",
          appearance: row.appearance || "",
          solids: row.solids || ""
        })),
        solidContent: groupSolidRows(data.solidContent)
      });
    } catch (err) {
      console.error('Fetch document error:', err);
      alert("❌ " + (err.message || "Gagal memuat dokumen"));
      navigate("/lab/pb/admin1/dokumen");
    } finally {
      setLoading(false);
    }
  };

  const groupSolidRows = (rows) => {
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.sample_time]) grouped[r.sample_time] = [];
      grouped[r.sample_time].push({
        id: r.id,
        alumFoilNo: r.alum_foil_no || "",
        wtAlumFoil: r.wt_alum_foil || "",
        wtGlue: r.wt_glue || "",
        wtAlumFoilDryGlue: r.wt_alum_foil_dry_glue || "",
        wtDryGlue: r.wt_dry_glue || "",
        solidsContent: r.solids_content || "",
        remark: r.remark || ""
      });
    });

    return Object.entries(grouped).map(([sampleTime, rows]) => ({
      sampleTime,
      rows
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm("⚠️ Apakah Anda yakin ingin menghapus dokumen ini?")) return;

    try {
      const token = getAuthToken();
      
      const res = await fetch(
        `${API_BASE}/resin-inspection-documents/${id}`,
        {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghapus dokumen");
      }
      
      alert("✅ Dokumen berhasil dihapus");
      navigate("/lab/pb/admin1/dokumen");
    } catch (err) {
      console.error('Delete error:', err);
      alert("❌ " + (err.message || "Gagal menghapus dokumen"));
    }
  };

  const handleUpdate = async () => {
    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_BASE}/resin-inspection/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal update dokumen");
      }
      
      alert("✅ Dokumen berhasil diperbarui");
      setIsEditing(false);
      fetchDocument();
    } catch (err) {
      console.error('Update error:', err);
      alert("❌ " + (err.message || "Gagal update dokumen"));
    }
  };

  const handleInspectionChange = (i, field, value) => {
    const updated = [...formData.inspection];
    updated[i][field] = value;
    setFormData({ ...formData, inspection: updated });
  };

  const handleSolidChange = (sIdx, rIdx, field, value) => {
    const updated = [...formData.solidContent];
    updated[sIdx].rows[rIdx][field] = value;
    setFormData({ ...formData, solidContent: updated });
  };

  if (loading || !documentData || !formData) {
    return (
      <div className="resin-view-loading">
        <h3>Memuat Data...</h3>
      </div>
    );
  }

  // Helper untuk render cell 
  const renderCell = (value, onChangeFn, type = "text") => {
    if (isEditing) {
      return <input type={type} value={value} onChange={(e) => onChangeFn(e.target.value)} className="edit-input" />;
    }
    return <span className="view-text">{value || "-"}</span>;
  };

  return (
    <div className="resin-view-container">
      {/* HEADER SECTION */}
      <div className="resin-header">
        <div className="header-info">
          <h2>{isEditing ? "📝 Edit Resin Inspection" : "🧴 Resin Inspection"}</h2>
          <div className="doc-meta">
            <span><strong>Title:</strong> {documentData.document.title}</span>
            <span><strong>Created:</strong> {new Date(documentData.document.created_at).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="resin-actions">
          {isEditing ? (
            <>
              <button className="btn-save" onClick={handleUpdate}>💾 Simpan Perubahan</button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  fetchDocument();
                }}
              >
                ✖️ Batal
              </button>
            </>
          ) : (
            <>
              <button className="btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit Data</button>
              <button className="btn-delete" onClick={handleDelete}>🗑️ Hapus</button>
              <button className="btn-back" onClick={() => navigate("/lab/pb/admin1/dokumen")}>
                ⬅️ Kembali
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTION 1: INSPECTION RESULT */}
      <div className="resin-section">
        <div className="section-title">
          <h3>🔍 Inspection Result</h3>
        </div>
        <div className="resin-table-wrapper">
          <table className="resin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Cert Test No</th>
                <th>Resin Tank</th>
                <th>Quantity</th>
                <th>Spec. Gravity</th>
                <th>Viscosity</th>
                <th>pH</th>
                <th>Gel Time</th>
                <th>Water Tol.</th>
                <th>Appearance</th>
                <th>Solids (%)</th>
              </tr>
            </thead>
            <tbody>
              {formData.inspection.map((row, i) => (
                <tr key={i}>
                  <td className="col-no">{i + 1}</td>
                  <td>{renderCell(row.certTestNo, (val) => handleInspectionChange(i, "certTestNo", val))}</td>
                  <td>{renderCell(row.resinTank, (val) => handleInspectionChange(i, "resinTank", val))}</td>
                  <td>{renderCell(row.quantity, (val) => handleInspectionChange(i, "quantity", val))}</td>
                  <td>{renderCell(row.specificGravity, (val) => handleInspectionChange(i, "specificGravity", val))}</td>
                  <td>{renderCell(row.viscosity, (val) => handleInspectionChange(i, "viscosity", val))}</td>
                  <td>{renderCell(row.ph, (val) => handleInspectionChange(i, "ph", val))}</td>
                  <td>{renderCell(row.gelTime, (val) => handleInspectionChange(i, "gelTime", val))}</td>
                  <td>{renderCell(row.waterTolerance, (val) => handleInspectionChange(i, "waterTolerance", val))}</td>
                  <td>{renderCell(row.appearance, (val) => handleInspectionChange(i, "appearance", val))}</td>
                  <td>{renderCell(row.solids, (val) => handleInspectionChange(i, "solids", val))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SOLID CONTENT */}
      <div className="resin-section">
        <div className="section-title">
          <h3>🧪 Solid Content Analysis</h3>
        </div>

        {formData.solidContent.map((sample, sIdx) => (
          <div key={sIdx} className="sample-block">
            <div className="sample-time-badge">
              ⏰ Sample Time: <strong>{sample.sampleTime}</strong>
            </div>

            <div className="resin-table-wrapper">
              <table className="resin-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Alum Foil No</th>
                    <th>Wt Alum Foil (g)</th>
                    <th>Wt Glue (g)</th>
                    <th>Wt Alum + Dry Glue (g)</th>
                    <th>Wt Dry Glue (g)</th>
                    <th>Solids Content (%)</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="col-no">{rIdx + 1}</td>
                      <td>{renderCell(row.alumFoilNo, (val) => handleSolidChange(sIdx, rIdx, "alumFoilNo", val))}</td>
                      <td>{renderCell(row.wtAlumFoil, (val) => handleSolidChange(sIdx, rIdx, "wtAlumFoil", val))}</td>
                      <td>{renderCell(row.wtGlue, (val) => handleSolidChange(sIdx, rIdx, "wtGlue", val))}</td>
                      <td>{renderCell(row.wtAlumFoilDryGlue, (val) => handleSolidChange(sIdx, rIdx, "wtAlumFoilDryGlue", val))}</td>
                      <td>{renderCell(row.wtDryGlue, (val) => handleSolidChange(sIdx, rIdx, "wtDryGlue", val))}</td>
                      <td>{renderCell(row.solidsContent, (val) => handleSolidChange(sIdx, rIdx, "solidsContent", val))}</td>
                      <td>{renderCell(row.remark, (val) => handleSolidChange(sIdx, rIdx, "remark", val))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}