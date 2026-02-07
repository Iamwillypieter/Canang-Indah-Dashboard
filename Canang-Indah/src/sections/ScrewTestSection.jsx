import { formatNumber } from '../utils/calculations';

export default function ScrewTestSection({ screwData, onChange, faceAvg, edgeAvg }) {
  return (
    <div className="section">
      <h3 className="section-title">🔩 Screw Test</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>FACE [n/mm²]</th>
              <th>EDGE [n/mm²]</th>
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
                    name={`face_${pos}`} 
                    value={screwData[`face_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    step="0.01" 
                    name={`edge_${pos}`} 
                    value={screwData[`edge_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
              </tr>
            ))}
            <tr className="table-row-bold">
              <td>AVG</td>
              <td>{formatNumber(faceAvg)}</td>
              <td>{formatNumber(edgeAvg)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}