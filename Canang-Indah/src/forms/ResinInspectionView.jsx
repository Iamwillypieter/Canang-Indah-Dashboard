import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ResinInspectionView.css";

export default function ResinInspectionView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/resin-inspection/${id}`);
      const data = await res.json();
      setDocumentData(data);

      setFormData({
        date: data.document.date,
        shift: data.document.shift,
        group: data.document.group_name,
        comment_by: data.document.comment_by || "",
        createdBy: data.document.created_by || "",
        inspection: data.inspection.map(row => ({
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
      console.error(err);
      alert("Gagal memuat dokumen");
    }
  };

  const groupSolidRows = (rows) => {
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.sample_time]) grouped[r.sample_time] = [];
      grouped[r.sample_time].push({
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
    if (!window.confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;

    try {
      const res = await fetch(
        `http://localhost:3001/api/resin-inspection-documents/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      alert("✅ Dokumen berhasil dihapus");
      navigate("/lab/pb/admin1/dokumen");
    } catch {
      alert("❌ Gagal menghapus dokumen");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/resin-inspection/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error();
      alert("✅ Dokumen berhasil diperbarui");
      setIsEditing(false);
      fetchDocument();
    } catch {
      alert("❌ Gagal update dokumen");
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

  if (!documentData || !formData) return <div className="resin-view">Loading...</div>;

  return (
    <div className="resin-view">

      {/* HEADER */}
      <div className="resin-header">
        <div>
          <h2>🧴 Resin Inspection - {documentData.document.title}</h2>
          <p>
            Dibuat: {new Date(documentData.document.created_at).toLocaleString()}
          </p>
        </div>

        <div className="resin-actions">
          {isEditing ? (
            <>
              <button className="btn-save" onClick={handleUpdate}>💾 Simpan</button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  fetchDocument();
                }}
              >
                ❌ Batal
              </button>
            </>
          ) : (
            <>
              <button className="btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit</button>
              <button className="btn-delete" onClick={handleDelete}>🗑 Hapus</button>
              <button className="btn-back" onClick={() => navigate("/lab/pb/admin1/dokumen")}>
                ← Kembali
              </button>
            </>
          )}
        </div>
      </div>

      {/* INSPECTION */}
      <div className="resin-section">
        <h3>🔍 Inspection Result</h3>
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
                <th>Solids</th>
              </tr>
            </thead>
            <tbody>
              {formData.inspection.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {Object.keys(row).map(field => (
                    <td key={field}>
                      {isEditing ? (
                        <input
                          value={row[field]}
                          onChange={e =>
                            handleInspectionChange(i, field, e.target.value)
                          }
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

      {/* SOLID CONTENT */}
      <div className="resin-section">
        <h3>🧪 Solid Content</h3>

        {formData.solidContent.map((sample, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 20 }}>
            <div className="sample-time">
              Sample Time: {sample.sampleTime}
            </div>

            <div className="resin-table-wrapper">
              <table className="resin-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Alum Foil No</th>
                    <th>Wt Alum Foil</th>
                    <th>Wt Glue</th>
                    <th>Wt Alum Foil + Dry Glue</th>
                    <th>Wt Dry Glue</th>
                    <th>Solids Content</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td>{rIdx + 1}</td>
                      {Object.keys(row).map(field => (
                        <td key={field}>
                          {isEditing ? (
                            <input
                              value={row[field]}
                              onChange={e =>
                                handleSolidChange(sIdx, rIdx, field, e.target.value)
                              }
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
        ))}
      </div>

    </div>
  );
}
