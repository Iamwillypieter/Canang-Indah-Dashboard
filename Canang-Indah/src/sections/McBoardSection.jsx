import { formatNumber } from '../utils/calculations';

export default function McBoardSection({ mcBoardData, onChange, mcValues, avgW1, avgW2, avgMC }) {
  return (
    <div className="section">
      <h3 className="section-title">💧 MC Board</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>W1 [gr]</th>
              <th>W2 [gr]</th>
              <th>MC [%]</th>
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
                    name={`w1_${pos}`} 
                    value={mcBoardData[`w1_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    step="0.01" 
                    name={`w2_${pos}`} 
                    value={mcBoardData[`w2_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
                <td>
                  {formatNumber(mcValues[pos])}
                </td>
              </tr>
            ))}
            <tr className="table-row-bold">
              <td>AVG</td>
              <td>{formatNumber(avgW1)}</td>
              <td>{formatNumber(avgW2)}</td>
              <td>{formatNumber(avgMC)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}