import { useState, useEffect } from "react";
import "./ResinInspectionForm.css";

export default function ResinInspectionForm() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("resinInspectionForm");
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
    localStorage.setItem(
      "resinInspectionForm",
      JSON.stringify(formData)
    );
  }, [formData]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInspectionChange = (index, field, value) => {
    const updated = [...formData.inspection];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, inspection: updated });
  };

  const handleSolidChange = (sampleIndex, rowIndex, field, value) => {
    const updated = [...formData.solidContent];
    updated[sampleIndex] = {
      ...updated[sampleIndex],
      rows: updated[sampleIndex].rows.map((row, idx) =>
        idx === rowIndex ? { ...row, [field]: value } : row
      )
    };
    setFormData({ ...formData, solidContent: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3001/api/resin-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          shift: formData.shift,
          group: formData.group,
          inspection: formData.inspection,
          solidContent: formData.solidContent,
          comment_by: formData.comment_by,
          createdBy: formData.createdBy
        })
      });
      
      if (response.ok) {
        alert('✅ Data Resin Inspection berhasil disimpan!');
      } else {
        throw new Error('Gagal simpan data');
      }
      if (response.ok) {
        localStorage.removeItem("resinInspectionForm");
        alert("✅ Data Resin Inspection berhasil disimpan!");
      }

    } catch (err) {
      console.error(err);
      alert('❌ Gagal simpan data: ' + err.message);
    }
  };

  return (
    <div className="form-wrapper">
      <h2 className="form-title">RAW RESIN INSPECTION 🛠️</h2>

      <form onSubmit={handleSubmit}>

        {/* HEADER */}
        <table>
          <tbody>
            <tr>
              <td className="label">Date</td>
              <td colSpan="4">
                <input type="date" name="date" value={formData.date} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label">Shift</td>
              <td colSpan="4">
                <input type="text" name="shift" value={formData.shift} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label">Group</td>
              <td colSpan="4">
                <input type="text" name="group" value={formData.group} onChange={handleChange} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* INSPECTION */}
        <table>
          <thead>
            <tr>
              <th className="label">Load no</th>
              {[1, 2, 3, 4].map((n) => <th key={n}>{n}</th>)}
            </tr>
          </thead>
          <tbody>
            {renderRow("Cert. Test no", "certTestNo")}
            {renderRow("Resin Tank", "resinTank")}
            {renderRow("Quantity", "quantity", "Ton")}
            {renderRow("Specific Gravity", "specificGravity", "g/cm³")}
            {renderRow("Viscosity at 30%", "viscosity", "cps")}
            {renderRow("pH at 30%", "ph")}
            {renderRow("Gelation Time", "gelTime", "scc")}
            {renderRow("Water Tolerance", "waterTolerance", "%")}
            {renderRow("Warna / Penampakan", "appearance")}
            {renderRow("Solids Content", "solids", "%")}
          </tbody>
        </table>

        {/* SOLIDS CONTENT */}
        <h3 style={{ margin: "20px 0 10px" }}>Solids Content</h3>

        <table>
          <thead>
            <tr>
              <th>Sample / Time</th>
              <th>Alum Foil no</th>
              <th>Wt of Alumfoil</th>
              <th>Wt of Glue</th>
              <th>Wt Alum Foil + Dry Glue</th>
              <th>Wt Dry Glue</th>
              <th>Solids Content</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {formData.solidContent.map((sample, sIdx) =>
              sample.rows.map((row, rIdx) => (
                <tr key={`${sIdx}-${rIdx}`}>
                  {rIdx === 0 && (
                    <td rowSpan={3} style={{ fontWeight: "bold", textAlign: "center" }}>
                      {sample.sampleTime}
                    </td>
                  )}
                  {Object.keys(row).map((key) => (
                    <td key={key}>
                      <input
                        value={row[key]}
                        onChange={(e) =>
                          handleSolidChange(sIdx, rIdx, key, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <table className="footer-table">
          <tbody>
            <tr>
              <td>Komentar</td>
              <td>
                <input name="comment_by" value={formData.comment_by} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td>Dibuat oleh</td>
              <td>
                <input name="createdBy" value={formData.createdBy} onChange={handleChange} />
              </td>
            </tr>
          </tbody>
        </table>

        <button type="submit" className="submit-btn">Simpan</button>
      </form>
    </div>
  );

  function renderRow(label, field, unit) {
    return (
      <tr>
        <td className="label">{label}</td>
        {formData.inspection.map((item, i) => (
          <td key={i}>
            <div className="cell">
              <input
                value={item[field]}
                onChange={(e) =>
                  handleInspectionChange(i, field, e.target.value)
                }
              />
              {unit && <span className="unit">{unit}</span>}
            </div>
          </td>
        ))}
      </tr>
    );
  }
}
