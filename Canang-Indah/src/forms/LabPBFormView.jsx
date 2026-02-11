import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LabPBForm.css';
import SampleTable from '../components/SampleTable.jsx';
import { getLabReportById, updateLabReport } from '../services/Api.js';
import {
  calculateIbAverage,
  calculateDensityAverageIb,
  calculateMorAverage,
  calculateDensityAverageBs,
  calculateFaceAverage,
  calculateEdgeAverage,
  calculateMinMean,
  calculateMC,
  calculateMcAverage,
  calculateW1Average,
  calculateW2Average,
  calculateTS,
  calculateTsAverage,
  calculateT1Average,
  calculateT2Average,
  calculateSurfaceAverage,
  formatNumber
} from '../utils/calculations';

export default function LabPBFormView({ mode = 'view' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const isReadOnly = mode === 'view';

  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({});
  const [samples, setSamples] = useState([]);
  const [ibData, setIbData] = useState({});
  const [bsData, setBsData] = useState({});
  const [screwData, setScrewData] = useState({});
  const [densityProfileData, setDensityProfileData] = useState({});
  const [mcBoardData, setMcBoardData] = useState({});
  const [swellingData, setSwellingData] = useState({});
  const [surfaceSoundnessData, setSurfaceSoundnessData] = useState({});
  const [tebalFlakesData, setTebalFlakesData] = useState({});
  const [consHardenerData, setConsHardenerData] = useState({});
  const [geltimeData, setGeltimeData] = useState({});

  // --- FETCH DATA DARI DATABASE ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getLabReportById(id);
        setFormData(data.document);
        setSamples(data.samples);
        setIbData(data.ibData || {});
        setBsData(data.bsData || {});
        setScrewData(data.screwData || {});
        setDensityProfileData(data.densityProfileData || {});
        setMcBoardData(data.mcBoardData || {});
        setSwellingData(data.swellingData || {});
        setSurfaceSoundnessData(data.surfaceSoundnessData || {});
        setTebalFlakesData(data.tebalFlakesData || {});
        setConsHardenerData(data.consHardenerData || {});
        setGeltimeData(data.geltimeData || {});
      } catch (err) {
        alert("❌ Error: " + err.message);
        navigate('/lab/pb/admin1/lab-pb-form');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // --- HANDLERS ---
  const handleInputChange = (setter, state) => (e) => {
    setter({ ...state, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!window.confirm('💾 Update data dokumen ini?')) return;

    try {
      const payload = {
        ...formData,
        samples,
        ibData: { 
          ...ibData, 
          ib_avg: calculateIbAverage(ibData), 
          density_avg: calculateDensityAverageIb(ibData) 
        },
        bsData: { 
          ...bsData, 
          mor_avg: calculateMorAverage(bsData), 
          bs_density_avg: calculateDensityAverageBs(bsData) 
        },
        screwData: { 
          ...screwData, 
          face_avg: calculateFaceAverage(screwData), 
          edge_avg: calculateEdgeAverage(screwData) 
        },
        densityProfileData,
        mcBoardData: { 
          ...mcBoardData, 
          avg_w1: calculateW1Average(mcBoardData), 
          avg_w2: calculateW2Average(mcBoardData), 
          avg_mc: calculateMcAverage(mcBoardData) 
        },
        swellingData: { 
          ...swellingData, 
          avg_t1: calculateT1Average(swellingData), 
          avg_t2: calculateT2Average(swellingData), 
          avg_ts: calculateTsAverage(swellingData) 
        },
        surfaceSoundnessData: { 
          ...surfaceSoundnessData, 
          avg_surface: calculateSurfaceAverage(surfaceSoundnessData) 
        },
        tebalFlakesData,
        consHardenerData,
        geltimeData
      };

      await updateLabReport(id, payload);
      alert('✅ Data berhasil diperbarui!');
      navigate('/lab/pb/admin1/dokumen');
    } catch (err) {
      alert('❌ Gagal update: ' + err.message);
    }
  };

  if (loading) return <div className="loading-screen">Sedang mengambil data dari gudang...</div>;

  return (
    <div className="lab-form-container">
      <div className="view-header">
        <button type="button" onClick={() => navigate(-1)} className="back-button">⬅️ Kembali</button>
        <h2 className="lab-form-title">
          {isReadOnly ? '👁️ View Document' : '✏️ Edit Document'}: {formData.board_no}
        </h2>
      </div>

      <form onSubmit={handleUpdate}>
        {/* SECTION 1: DATA UTAMA */}
        <div className="section">
          <h3 className="section-title">⚙️ Data Utama</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Timestamp:</label>
              <input 
                type="datetime-local" 
                name="timestamp" 
                value={formData.timestamp || ''} 
                onChange={(e) => setFormData({...formData, timestamp: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Board No:</label>
              <input 
                name="board_no" 
                value={formData.board_no || ''} 
                onChange={(e) => setFormData({...formData, board_no: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Set Weight:</label>
              <input 
                type="number" 
                step="0.1" 
                name="set_weight" 
                value={formData.set_weight || ''} 
                onChange={(e) => setFormData({...formData, set_weight: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Shift/Group:</label>
              <select 
                name="shift_group" 
                value={formData.shift_group || 'Shift A'} 
                onChange={(e) => setFormData({...formData, shift_group: e.target.value})} 
                disabled={isReadOnly} 
                className="form-select"
              >
                <option>Shift A</option>
                <option>Shift B</option>
                <option>Shift C</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tested By:</label>
              <input 
                name="tested_by" 
                value={formData.tested_by || ''} 
                onChange={(e) => setFormData({...formData, tested_by: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
          </div>

          <h4 className="sub-section-title">🔧 Spesifikasi Teknis</h4>
          <div className="form-grid-small">
            <div className="form-group">
              <label className="form-label">Density Min:</label>
              <input 
                type="number" 
                step="0.01" 
                name="density_min" 
                value={formData.density_min || ''} 
                onChange={(e) => setFormData({...formData, density_min: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Density Max:</label>
              <input 
                type="number" 
                step="0.01" 
                name="density_max" 
                value={formData.density_max || ''} 
                onChange={(e) => setFormData({...formData, density_max: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Board Type:</label>
              <input 
                name="board_type" 
                value={formData.board_type || ''} 
                onChange={(e) => setFormData({...formData, board_type: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Glue SL:</label>
              <input 
                type="text" 
                name="glue_sl" 
                value={formData.glue_sl || ''} 
                onChange={(e) => setFormData({...formData, glue_sl: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Glue CL:</label>
              <input 
                type="text" 
                name="glue_cl" 
                value={formData.glue_cl || ''} 
                onChange={(e) => setFormData({...formData, glue_cl: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thick Min:</label>
              <input 
                type="number" 
                step="0.1" 
                name="thick_min" 
                value={formData.thick_min || ''} 
                onChange={(e) => setFormData({...formData, thick_min: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thick Max:</label>
              <input 
                type="number" 
                step="0.1" 
                name="thick_max" 
                value={formData.thick_max || ''} 
                onChange={(e) => setFormData({...formData, thick_max: e.target.value})} 
                disabled={isReadOnly} 
                className="form-input"
              />
            </div>
          </div>

          <h4 className="sub-section-title">📊 Data Sample (24 pcs)</h4>
          <SampleTable 
            samples={samples} 
            onSamplesChange={isReadOnly ? () => {} : setSamples} 
          />
        </div>

        {/* SECTION 2: INTERNAL BONDING */}
        <div className="section">
          <h3 className="section-title">🧪 Internal Bonding Test</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>IB [n/mm²]</th>
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
                        name={`ib_${pos}`} 
                        value={ibData[`ib_${pos}`] || ''} 
                        onChange={handleInputChange(setIbData, ibData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.1" 
                        name={`density_${pos}`} 
                        value={ibData[`density_${pos}`] || ''} 
                        onChange={handleInputChange(setIbData, ibData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(calculateIbAverage(ibData))}</td>
                  <td>{formatNumber(calculateDensityAverageIb(ibData))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: BENDING STRANGE */}
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
                        value={bsData[`mor_${pos}`] || ''} 
                        onChange={handleInputChange(setBsData, bsData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.1" 
                        name={`density_${pos}`} 
                        value={bsData[`density_${pos}`] || ''} 
                        onChange={handleInputChange(setBsData, bsData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(calculateMorAverage(bsData))}</td>
                  <td>{formatNumber(calculateDensityAverageBs(bsData))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: SCREW TEST */}
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
                        value={screwData[`face_${pos}`] || ''} 
                        onChange={handleInputChange(setScrewData, screwData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01" 
                        name={`edge_${pos}`} 
                        value={screwData[`edge_${pos}`] || ''} 
                        onChange={handleInputChange(setScrewData, screwData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(calculateFaceAverage(screwData))}</td>
                  <td>{formatNumber(calculateEdgeAverage(screwData))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: DENSITY PROFILE */}
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
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_top_le" 
                      value={densityProfileData.max_top_le || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_top_ml" 
                      value={densityProfileData.max_top_ml || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_top_md" 
                      value={densityProfileData.max_top_md || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_top_mr" 
                      value={densityProfileData.max_top_mr || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_top_ri" 
                      value={densityProfileData.max_top_ri || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                </tr>
                <tr>
                  <td>MAX BOT [kg/m³]</td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_bot_le" 
                      value={densityProfileData.max_bot_le || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_bot_ml" 
                      value={densityProfileData.max_bot_ml || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_bot_md" 
                      value={densityProfileData.max_bot_md || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_bot_mr" 
                      value={densityProfileData.max_bot_mr || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="max_bot_ri" 
                      value={densityProfileData.max_bot_ri || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                </tr>
                <tr>
                  <td>MIN [kg/m³]</td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="min_le" 
                      value={densityProfileData.min_le || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="min_ml" 
                      value={densityProfileData.min_ml || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="min_md" 
                      value={densityProfileData.min_md || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="min_mr" 
                      value={densityProfileData.min_mr || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="min_ri" 
                      value={densityProfileData.min_ri || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                </tr>
                <tr>
                  <td>MEAN [kg/m³]</td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="mean_le" 
                      value={densityProfileData.mean_le || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="mean_ml" 
                      value={densityProfileData.mean_ml || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="mean_md" 
                      value={densityProfileData.mean_md || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="mean_mr" 
                      value={densityProfileData.mean_mr || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="mean_ri" 
                      value={densityProfileData.mean_ri || ''} 
                      onChange={handleInputChange(setDensityProfileData, densityProfileData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                </tr>
                <tr className="table-row-bold">
                  <td>MIN/MEAN [%]</td>
                  <td>{formatNumber(calculateMinMean(densityProfileData.min_le, densityProfileData.mean_le))}</td>
                  <td>{formatNumber(calculateMinMean(densityProfileData.min_ml, densityProfileData.mean_ml))}</td>
                  <td>{formatNumber(calculateMinMean(densityProfileData.min_md, densityProfileData.mean_md))}</td>
                  <td>{formatNumber(calculateMinMean(densityProfileData.min_mr, densityProfileData.mean_mr))}</td>
                  <td>{formatNumber(calculateMinMean(densityProfileData.min_ri, densityProfileData.mean_ri))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 6: MC BOARD */}
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
                        value={mcBoardData[`w1_${pos}`] || ''} 
                        onChange={handleInputChange(setMcBoardData, mcBoardData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01" 
                        name={`w2_${pos}`} 
                        value={mcBoardData[`w2_${pos}`] || ''} 
                        onChange={handleInputChange(setMcBoardData, mcBoardData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      {formatNumber(calculateMC(
                        mcBoardData[`w1_${pos}`], 
                        mcBoardData[`w2_${pos}`]
                      ))}
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(calculateW1Average(mcBoardData))}</td>
                  <td>{formatNumber(calculateW2Average(mcBoardData))}</td>
                  <td>{formatNumber(calculateMcAverage(mcBoardData))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 7: SWELLING 2H */}
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
                        value={swellingData[`t1_${pos}`] || ''} 
                        onChange={handleInputChange(setSwellingData, swellingData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01" 
                        name={`t2_${pos}`} 
                        value={swellingData[`t2_${pos}`] || ''} 
                        onChange={handleInputChange(setSwellingData, swellingData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      {formatNumber(calculateTS(
                        swellingData[`t1_${pos}`], 
                        swellingData[`t2_${pos}`]
                      ))}
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(calculateT1Average(swellingData))}</td>
                  <td>{formatNumber(calculateT2Average(swellingData))}</td>
                  <td>{formatNumber(calculateTsAverage(swellingData))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 8: SURFACE SOUNDNESS */}
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
                        value={surfaceSoundnessData[`t1_${pos}_surface`] || ''} 
                        onChange={handleInputChange(setSurfaceSoundnessData, surfaceSoundnessData)} 
                        disabled={isReadOnly} 
                        className="input-table"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(calculateSurfaceAverage(surfaceSoundnessData))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 9: TEBAL FLAKES */}
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
                      value={tebalFlakesData.avg_tebal || ''} 
                      onChange={handleInputChange(setTebalFlakesData, tebalFlakesData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 10: CONS HARDENER */}
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
                      value={consHardenerData.avg_cons || ''} 
                      onChange={handleInputChange(setConsHardenerData, consHardenerData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 11: GELTIME GLUE MIX */}
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
                      value={geltimeData.sl || ''} 
                      onChange={handleInputChange(setGeltimeData, geltimeData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="1" 
                      name="cl" 
                      value={geltimeData.cl || ''} 
                      onChange={handleInputChange(setGeltimeData, geltimeData)} 
                      disabled={isReadOnly} 
                      className="input-table"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-actions">
          {!isReadOnly ? (
            <>
              <button type="submit" className="submit-button">💾 Simpan Perubahan</button>
              <button 
                type="button" 
                onClick={() => navigate(-1)} 
                className="cancel-button"
              >
                ❌ Batal
              </button>
            </>
          ) : (
            <button 
              type="button" 
              onClick={() => navigate(`/lab/pb/admin1/lab-pb-form/${id}/edit`)} 
              className="edit-mode-button"
            >
              ✏️ Beralih ke Mode Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}