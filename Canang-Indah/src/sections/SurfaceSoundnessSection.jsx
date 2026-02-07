import { formatNumber } from '../utils/calculations';

export default function SurfaceSoundnessSection({ surfaceSoundnessData, onChange, avgSurface }) {
  return (
    <div className="section">
      <h3 className="section-title">🔊 Surface Soundness</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>T1 [n/mm²]</th>
            </tr>
          </thead>
          <tbody>
            {['le', 'ri'].map(pos => (
              <tr key={pos}>
                <td>{pos.toUpperCase()}</td>
                <td>
                  <input 
                    type="number" 
                    step="0.01" 
                    name={`t1_${pos}_surface`} 
                    value={surfaceSoundnessData[`t1_${pos}_surface`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
              </tr>
            ))}
            <tr className="table-row-bold">
              <td>AVG</td>
              <td>{formatNumber(avgSurface)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}