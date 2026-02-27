export default function TebalFlakesSection({ tebalFlakesData, onChange }) {
  return (
    <div className="section">
      <h3 className="section-title">📏 Tebal Flakes</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>AVG TEBAL [mm]</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input 
                  type="number" 
                  step="0.01" 
                  name="avg_tebal" 
                  value={tebalFlakesData.avg_tebal} 
                  onChange={onChange} 
                  className="input-table"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}