export default function InspectionTable({ inspection, onChange }) {
  const renderRow = (label, field, unit) => (
    <tr>
      <td className="label">{label}</td>
      {inspection.map((item, i) => (
        <td key={i}>
          <div className="cell">
            <input
              value={item[field]}
              onChange={e => onChange(i, field, e.target.value)}
            />
            {unit && <span className="unit">{unit}</span>}
          </div>
        </td>
      ))}
    </tr>
  );

  return (
    <table>
      <thead>
        <tr>
          <th className="label">Load no</th>
          {[1, 2, 3, 4].map(n => <th key={n}>{n}</th>)}
        </tr>
      </thead>
      <tbody>
        {renderRow("Cert. Test no", "certTestNo")}
        {renderRow("Resin Tank", "resinTank")}
        {renderRow("Quantity", "quantity", "Ton")}
        {renderRow("Specific Gravity", "specificGravity", "g/cm³")}
        {renderRow("Viscosity", "viscosity", "cps")}
        {renderRow("pH", "ph")}
        {renderRow("Gelation Time", "gelTime", "scc")}
        {renderRow("Water Tolerance", "waterTolerance", "%")}
        {renderRow("Appearance", "appearance")}
        {renderRow("Solids Content", "solids", "%")}
      </tbody>
    </table>
  );
}
