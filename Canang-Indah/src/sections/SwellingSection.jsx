import { formatNumber } from '../utils/calculations';

export default function SwellingSection({ swellingData, onChange, tsValues, avgT1, avgT2, avgTs }) {
  return (
    <div className="section">
      <h3 className="section-title">💧 Swelling 2h</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>T1 [mm]</th>
              <th>T2 [mm]</th>
              <th>TS [%]</th>
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
                    name={`t1_${pos}`} 
                    value={swellingData[`t1_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    step="0.01" 
                    name={`t2_${pos}`} 
                    value={swellingData[`t2_${pos}`]} 
                    onChange={onChange} 
                    className="input-table"
                  />
                </td>
                <td>
                  {formatNumber(tsValues[pos])}
                </td>
              </tr>
            ))}
            <tr className="table-row-bold">
              <td>AVG</td>
              <td>{formatNumber(avgT1)}</td>
              <td>{formatNumber(avgT2)}</td>
              <td>{formatNumber(avgTs)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}