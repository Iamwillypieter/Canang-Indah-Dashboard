import { formatNumber } from '../utils/calculations';

export default function DensityProfileSection({ densityProfileData, onChange, minMeanValues }) {
  return (
    <div className="section">
      <h3 className="section-title">📊 Density Profile</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>LE</th>
              <th>ML</th>
              <th>MD</th>
              <th>MR</th>
              <th>RI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MAX TOP [kg/m³]</td>
              <td><input type="number" step="0.1" name="max_top_le" value={densityProfileData.max_top_le} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_top_ml" value={densityProfileData.max_top_ml} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_top_md" value={densityProfileData.max_top_md} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_top_mr" value={densityProfileData.max_top_mr} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_top_ri" value={densityProfileData.max_top_ri} onChange={onChange} className="input-table" /></td>
            </tr>
            <tr>
              <td>MAX BOT [kg/m³]</td>
              <td><input type="number" step="0.1" name="max_bot_le" value={densityProfileData.max_bot_le} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_bot_ml" value={densityProfileData.max_bot_ml} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_bot_md" value={densityProfileData.max_bot_md} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_bot_mr" value={densityProfileData.max_bot_mr} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="max_bot_ri" value={densityProfileData.max_bot_ri} onChange={onChange} className="input-table" /></td>
            </tr>
            <tr>
              <td>MIN [kg/m³]</td>
              <td><input type="number" step="0.1" name="min_le" value={densityProfileData.min_le} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="min_ml" value={densityProfileData.min_ml} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="min_md" value={densityProfileData.min_md} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="min_mr" value={densityProfileData.min_mr} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="min_ri" value={densityProfileData.min_ri} onChange={onChange} className="input-table" /></td>
            </tr>
            <tr>
              <td>MEAN [kg/m³]</td>
              <td><input type="number" step="0.1" name="mean_le" value={densityProfileData.mean_le} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="mean_ml" value={densityProfileData.mean_ml} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="mean_md" value={densityProfileData.mean_md} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="mean_mr" value={densityProfileData.mean_mr} onChange={onChange} className="input-table" /></td>
              <td><input type="number" step="0.1" name="mean_ri" value={densityProfileData.mean_ri} onChange={onChange} className="input-table" /></td>
            </tr>
            <tr className="table-row-bold">
              <td>MIN/MEAN [%]</td>
              <td>{formatNumber(minMeanValues.le)}</td>
              <td>{formatNumber(minMeanValues.ml)}</td>
              <td>{formatNumber(minMeanValues.md)}</td>
              <td>{formatNumber(minMeanValues.mr)}</td>
              <td>{formatNumber(minMeanValues.ri)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}