import { formatNumber } from '../utils/calculations';

export default function BendingStrangeSection({ bsData, onChange, morAvg, densityAvg }) {
  return (
    <div className="section">
      <h3 className="section-title">🧱 Bending Strange Test</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>MOR [n/mm²]</th>
              <th>Density [kg/m³]</th>
            </tr>
          </thead>
          <tbody>
            {['le', 'ml', 'md', 'mr', 'ri'].map(pos => (
              <tr key={pos}>
                <td>{pos.toUpperCase()}</td>
                <td>
                  <input 
                    type="number" 
                    step="0.01" 
                    name={`mor_${pos}`} 
                    value={bsData[`mor_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    step="0.1" 
                    name={`density_${pos}`} 
                    value={bsData[`density_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
              </tr>
            ))}
            <tr className="table-row-bold">
              <td>AVG</td>
              <td>{formatNumber(morAvg)}</td>
              <td>{formatNumber(densityAvg)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}