export default function ConsHardenerSection({ consHardenerData, onChange }) {
  return (
    <div className="section">
      <h3 className="section-title">🧪 Cons Hardener</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>AVG [%]</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input 
                  type="number" 
                  step="0.01" 
                  name="avg_cons" 
                  value={consHardenerData.avg_cons} 
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