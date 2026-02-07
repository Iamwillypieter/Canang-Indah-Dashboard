export default function GeltimeSection({ geltimeData, onChange }) {
  return (
    <div className="section">
      <h3 className="section-title">⏱️ Geltime Glue Mix</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>SL [s]</th>
              <th>CL [s]</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input 
                  type="number" 
                  step="1" 
                  name="sl" 
                  value={geltimeData.sl} 
                  onChange={onChange} 
                  className="input-table"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  step="1" 
                  name="cl" 
                  value={geltimeData.cl} 
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