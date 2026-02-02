// src/components/forms/LabPBForm.jsx
import { useState, useEffect } from 'react';
import './LabPBForm.css';
import SampleTable from '../helper/SampleTable.jsx';
import { useFormPersistence } from '../helper/useFormPersistence.js';
import { submitLabReport } from '../services/Api.js';
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

export default function LabPBForm() {
  console.log('✅ LabPBForm dirender!');
  
  // State untuk Lab PB
  const [formData, setFormData, clearFormData] = useFormPersistence('formData', {
    timestamp: new Date().toISOString().slice(0, 16),
    board_no: '',
    set_weight: '',
    shift_group: 'Shift A',
    tested_by: '',
    density_min: '',
    density_max: '',
    board_type: '',
    glue_sl: '',
    glue_cl: '',
    thick_min: '',
    thick_max: ''
  });

  // State untuk Internal Bonding
  const [ibData, setIbData, clearIbData] = useFormPersistence('ibData', {
    ib_le: '',
    ib_ml: '',
    ib_md: '',
    ib_mr: '',
    ib_ri: '',
    density_le: '',
    density_ml: '',
    density_md: '',
    density_mr: '',
    density_ri: ''
  });

  // State untuk Bending Strange
  const [bsData, setBsData, clearBsData] = useFormPersistence('bsData', {
    mor_le: '',
    mor_ml: '',
    mor_md: '',
    mor_mr: '',
    mor_ri: '',
    density_le: '',
    density_ml: '',
    density_md: '',
    density_mr: '',
    density_ri: ''
  });

  const [screwData, setScrewData, clearScrewData] = useFormPersistence('screwData', {
    face_le: '',
    face_ml: '',
    face_md: '',
    face_mr: '',
    face_ri: '',
    edge_le: '',
    edge_ml: '',
    edge_md: '',
    edge_mr: '',
    edge_ri: ''
  });

  // State untuk Density Profile
  const [densityProfileData, setDensityProfileData, clearDensityProfileData] = useFormPersistence('densityProfileData', {
    max_top_le: '',
    max_top_ml: '',
    max_top_md: '',
    max_top_mr: '',
    max_top_ri: '',
    max_bot_le: '',
    max_bot_ml: '',
    max_bot_md: '',
    max_bot_mr: '',
    max_bot_ri: '',
    min_le: '',
    min_ml: '',
    min_md: '',
    min_mr: '',
    min_ri: '',
    mean_le: '',
    mean_ml: '',
    mean_md: '',
    mean_mr: '',
    mean_ri: ''
  });

  // State untuk MC Board
  const [mcBoardData, setMcBoardData, clearMcBoardData] = useFormPersistence('mcBoardData', {
    w1_le: '',
    w1_ml: '',
    w1_md: '',
    w1_mr: '',
    w1_ri: '',
    w2_le: '',
    w2_ml: '',
    w2_md: '',
    w2_mr: '',
    w2_ri: '',
  });

  // State untuk Swelling 2h
  const [swellingData, setSwellingData, clearSwellingData] = useFormPersistence('swellingData', {
    t1_le: '',
    t1_ml: '',
    t1_md: '',
    t1_mr: '',
    t1_ri: '',
    t2_le: '',
    t2_ml: '',
    t2_md: '',
    t2_mr: '',
    t2_ri: ''
  });

  // State untuk Surface Soundness
  const [surfaceSoundnessData, setSurfaceSoundnessData, clearSurfaceSoundnessData] = useFormPersistence('surfaceSoundnessData', {
    t1_le_surface: '',
    t1_ri_surface: ''
  });

  // State untuk Tebal Flakes
  const [tebalFlakesData, setTebalFlakesData, clearTebalFlakesData] = useFormPersistence('tebalFlakesData', {
    avg_tebal: ''
  });

  // State untuk Cons Harderner
  const [consHardenerData, setConsHardenerData, clearConsHardenerData] = useFormPersistence('consHardenerData', {
    avg_cons: ''
  });

  // State untuk Gel Time
  const [geltimeData, setGeltimeData, clearGeltimeData] = useFormPersistence('geltimeData', {
    sl: '',
    cl: ''
  });

  const createInitialSamples = () =>
    Array.from({ length: 24 }, (_, i) => ({
      no: i + 1,
      weight_gr: '',
      thickness_mm: '',
      length_mm: '',
      width_mm: ''
    }));

  const [samples, setSamples, clearSamplesData] =
    useFormPersistence('samples', createInitialSamples());


  const clearAllFormData = () => {
    if (window.confirm('⚠️ Apakah Anda yakin ingin menghapus semua data form yang sudah diisi?')) {
      clearFormData();
      clearSamplesData();
      clearIbData();
      clearBsData();
      clearScrewData();
      clearDensityProfileData();
      clearMcBoardData();
      clearSwellingData();
      clearSurfaceSoundnessData();
      clearTebalFlakesData();
      clearConsHardenerData();
      clearGeltimeData();
      alert('✅ Semua data form berhasil dihapus!');
    }
  };

  useEffect(() => {
    // Hanya set timestamp jika form masih kosong (belum pernah diisi)
    if (!formData.board_no && !formData.tested_by) {
      setFormData(prev => ({
        ...prev,
        timestamp: new Date().toISOString().slice(0, 16)
      }));
    }
  }, []);
  
  useEffect(() => {
    if (!Array.isArray(samples) || samples.length !== 24) {
      setSamples(createInitialSamples());
    }
  }, []);


  // Hitung semua nilai rata-rata menggunakan fungsi terpisah
  const ibAvg = calculateIbAverage(ibData);
  const densityAvgIb = calculateDensityAverageIb(ibData);
  const morAvg = calculateMorAverage(bsData);
  const densityAvgBs = calculateDensityAverageBs(bsData);
  const faceAvg = calculateFaceAverage(screwData);
  const edgeAvg = calculateEdgeAverage(screwData);

  // Hitung MIN/MEAN [%]
  const minMeanLe = calculateMinMean(densityProfileData.min_le, densityProfileData.mean_le);
  const minMeanMl = calculateMinMean(densityProfileData.min_ml, densityProfileData.mean_ml);
  const minMeanMd = calculateMinMean(densityProfileData.min_md, densityProfileData.mean_md);
  const minMeanMr = calculateMinMean(densityProfileData.min_mr, densityProfileData.mean_mr);
  const minMeanRi = calculateMinMean(densityProfileData.min_ri, densityProfileData.mean_ri);

  // Hitung MC [%]
  const mcLe = calculateMC(mcBoardData.w1_le, mcBoardData.w2_le);
  const mcMl = calculateMC(mcBoardData.w1_ml, mcBoardData.w2_ml);
  const mcMd = calculateMC(mcBoardData.w1_md, mcBoardData.w2_md);
  const mcMr = calculateMC(mcBoardData.w1_mr, mcBoardData.w2_mr);
  const mcRi = calculateMC(mcBoardData.w1_ri, mcBoardData.w2_ri);

  const avgW1 = calculateW1Average(mcBoardData);
  const avgW2 = calculateW2Average(mcBoardData);
  const avgMC = calculateMcAverage(mcBoardData);

  // Hitung TS [%]
  const tsLe = calculateTS(swellingData.t1_le, swellingData.t2_le);
  const tsMl = calculateTS(swellingData.t1_ml, swellingData.t2_ml);
  const tsMd = calculateTS(swellingData.t1_md, swellingData.t2_md);
  const tsMr = calculateTS(swellingData.t1_mr, swellingData.t2_mr);
  const tsRi = calculateTS(swellingData.t1_ri, swellingData.t2_ri);

  const avgT1 = calculateT1Average(swellingData);
  const avgT2 = calculateT2Average(swellingData);
  const avgTs = calculateTsAverage(swellingData);

  // Hitung AVG Surface Soundness
  const avgSurface = calculateSurfaceAverage(surfaceSoundnessData);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIbChange = (e) => {
    setIbData({ ...ibData, [e.target.name]: e.target.value });
  };

  const handleBsChange = (e) => {
    setBsData({ ...bsData, [e.target.name]: e.target.value });
  };

  const handleScrewChange = (e) => {
    setScrewData({ ...screwData, [e.target.name]: e.target.value });
  };

  const handleDensityProfileChange = (e) => {
    setDensityProfileData({ ...densityProfileData, [e.target.name]: e.target.value });
  };

  // Handler untuk MC Board
  const handleMcBoardChange = (e) => {
    setMcBoardData({ ...mcBoardData, [e.target.name]: e.target.value });
  };

  const handleSwellingChange = (e) => {
    setSwellingData({ ...swellingData, [e.target.name]: e.target.value });
  };

  const handleSurfaceChange = (e) => {
    setSurfaceSoundnessData({ ...surfaceSoundnessData, [e.target.name]: e.target.value });
  };

  const handleTebalFlakesChange = (e) => {
    setTebalFlakesData({ ...tebalFlakesData, [e.target.name]: e.target.value });
  };

  const handleConsHardenerChange = (e) => {
    setConsHardenerData({ ...consHardenerData, [e.target.name]: e.target.value });
  };

  const handleGeltimeChange = (e) => {
    setGeltimeData({ ...geltimeData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.board_no || !formData.tested_by) {
      alert('Harap isi Board No dan Tested By');
      return;
    }
    if (!window.confirm('📤 Apakah Anda yakin ingin mengirim laporan ini?')) {
      return;
    }
    try {
      // ✅ Format data sesuai struktur backend
      const payload = {
        timestamp: new Date(formData.timestamp).toISOString(),
        board_no: formData.board_no,
        set_weight: formData.set_weight,
        shift_group: formData.shift_group,
        tested_by: formData.tested_by,
        density_min: formData.density_min,
        density_max: formData.density_max,
        board_type: formData.board_type,
        glue_sl: formData.glue_sl,
        glue_cl: formData.glue_cl,
        thick_min: formData.thick_min,
        thick_max: formData.thick_max,
        
        // ✅ NESTED OBJECTS
        samples: samples.map(s => ({
          no: s.no,
          weight_gr: parseFloat(s.weight_gr) || 0,
          thickness_mm: parseFloat(s.thickness_mm) || 0,
          length_mm: parseFloat(s.length_mm) || 0,
          width_mm: parseFloat(s.width_mm) || 0
        })),
        
        ibData: {
          ib_le: parseFloat(ibData.ib_le) || null,
          ib_ml: parseFloat(ibData.ib_ml) || null,
          ib_md: parseFloat(ibData.ib_md) || null,
          ib_mr: parseFloat(ibData.ib_mr) || null,
          ib_ri: parseFloat(ibData.ib_ri) || null,
          ib_avg: isNaN(ibAvg) ? null : ibAvg,
          density_le: parseFloat(ibData.density_le) || null,
          density_ml: parseFloat(ibData.density_ml) || null,
          density_md: parseFloat(ibData.density_md) || null,
          density_mr: parseFloat(ibData.density_mr) || null,
          density_ri: parseFloat(ibData.density_ri) || null,
          density_avg: isNaN(densityAvgIb) ? null : densityAvgIb
        },
        
        bsData: {
          mor_le: parseFloat(bsData.mor_le) || null,
          mor_ml: parseFloat(bsData.mor_ml) || null,
          mor_md: parseFloat(bsData.mor_md) || null,
          mor_mr: parseFloat(bsData.mor_mr) || null,
          mor_ri: parseFloat(bsData.mor_ri) || null,
          mor_avg: isNaN(morAvg) ? null : morAvg,
          density_le: parseFloat(bsData.density_le) || null,
          density_ml: parseFloat(bsData.density_ml) || null,
          density_md: parseFloat(bsData.density_md) || null,
          density_mr: parseFloat(bsData.density_mr) || null,
          density_ri: parseFloat(bsData.density_ri) || null,
          bs_density_avg: isNaN(densityAvgBs) ? null : densityAvgBs
        },
        
        screwData: {
          face_le: parseFloat(screwData.face_le) || null,
          face_ml: parseFloat(screwData.face_ml) || null,
          face_md: parseFloat(screwData.face_md) || null,
          face_mr: parseFloat(screwData.face_mr) || null,
          face_ri: parseFloat(screwData.face_ri) || null,
          face_avg: isNaN(faceAvg) ? null : faceAvg,
          edge_le: parseFloat(screwData.edge_le) || null,
          edge_ml: parseFloat(screwData.edge_ml) || null,
          edge_md: parseFloat(screwData.edge_md) || null,
          edge_mr: parseFloat(screwData.edge_mr) || null,
          edge_ri: parseFloat(screwData.edge_ri) || null,
          edge_avg: isNaN(edgeAvg) ? null : edgeAvg
        },
        
        densityProfileData: {
          max_top_le: parseFloat(densityProfileData.max_top_le) || null,
          max_top_ml: parseFloat(densityProfileData.max_top_ml) || null,
          max_top_md: parseFloat(densityProfileData.max_top_md) || null,
          max_top_mr: parseFloat(densityProfileData.max_top_mr) || null,
          max_top_ri: parseFloat(densityProfileData.max_top_ri) || null,
          max_bot_le: parseFloat(densityProfileData.max_bot_le) || null,
          max_bot_ml: parseFloat(densityProfileData.max_bot_ml) || null,
          max_bot_md: parseFloat(densityProfileData.max_bot_md) || null,
          max_bot_mr: parseFloat(densityProfileData.max_bot_mr) || null,
          max_bot_ri: parseFloat(densityProfileData.max_bot_ri) || null,
          min_le: parseFloat(densityProfileData.min_le) || null,
          min_ml: parseFloat(densityProfileData.min_ml) || null,
          min_md: parseFloat(densityProfileData.min_md) || null,
          min_mr: parseFloat(densityProfileData.min_mr) || null,
          min_ri: parseFloat(densityProfileData.min_ri) || null,
          mean_le: parseFloat(densityProfileData.mean_le) || null,
          mean_ml: parseFloat(densityProfileData.mean_ml) || null,
          mean_md: parseFloat(densityProfileData.mean_md) || null,
          mean_mr: parseFloat(densityProfileData.mean_mr) || null,
          mean_ri: parseFloat(densityProfileData.mean_ri) || null
        },
        
        mcBoardData: {
          w1_le: parseFloat(mcBoardData.w1_le) || null,
          w1_ml: parseFloat(mcBoardData.w1_ml) || null,
          w1_md: parseFloat(mcBoardData.w1_md) || null,
          w1_mr: parseFloat(mcBoardData.w1_mr) || null,
          w1_ri: parseFloat(mcBoardData.w1_ri) || null,
          w2_le: parseFloat(mcBoardData.w2_le) || null,
          w2_ml: parseFloat(mcBoardData.w2_ml) || null,
          w2_md: parseFloat(mcBoardData.w2_md) || null,
          w2_mr: parseFloat(mcBoardData.w2_mr) || null,
          w2_ri: parseFloat(mcBoardData.w2_ri) || null,
          avg_w1: isNaN(avgW1) ? null : avgW1,
          avg_w2: isNaN(avgW2) ? null : avgW2,
          avg_mc: isNaN(avgMC) ? null : avgMC
        },
        
        swellingData: {
          t1_le: parseFloat(swellingData.t1_le) || null,
          t1_ml: parseFloat(swellingData.t1_ml) || null,
          t1_md: parseFloat(swellingData.t1_md) || null,
          t1_mr: parseFloat(swellingData.t1_mr) || null,
          t1_ri: parseFloat(swellingData.t1_ri) || null,
          t2_le: parseFloat(swellingData.t2_le) || null,
          t2_ml: parseFloat(swellingData.t2_ml) || null,
          t2_md: parseFloat(swellingData.t2_md) || null,
          t2_mr: parseFloat(swellingData.t2_mr) || null,
          t2_ri: parseFloat(swellingData.t2_ri) || null,
          avg_t1: isNaN(avgT1) ? null : avgT1,
          avg_t2: isNaN(avgT2) ? null : avgT2,
          avg_ts: isNaN(avgTs) ? null : avgTs
        },
        
        surfaceSoundnessData: {
          t1_le_surface: surfaceSoundnessData.t1_le_surface || null,
          t1_ri_surface: surfaceSoundnessData.t1_ri_surface || null,
          avg_surface: isNaN(avgSurface) ? null : avgSurface
        },
        
        tebalFlakesData: {
          avg_tebal: parseFloat(tebalFlakesData.avg_tebal) || null
        },
        
        consHardenerData: {
          avg_cons: parseFloat(consHardenerData.avg_cons) || null
        },
        
        geltimeData: {
          sl: parseFloat(geltimeData.sl) || null,
          cl: parseFloat(geltimeData.cl) || null
        }
      };

      // ✅ Kirim payload yang sudah terstruktur
      await submitLabReport('lab_pb', payload);
      
      alert('✅ Laporan berhasil dikirim!');
      if (window.confirm('🗑️ Apakah Anda ingin menghapus data form yang sudah dikirim?')) {
        clearAllFormData();
      }
    } catch (err) {
      alert('❌ Gagal kirim laporan: ' + err.message);
    }
  };

  return (
    <div className="lab-form-container">
      <h2 className="lab-form-title">📝 Input Laporan Lab PB</h2>
      <div className="info-bar">
        <span>💾 Data otomatis tersimpan. Refresh halaman tidak akan menghapus data yang sudah diisi.</span>
        <button type="button" onClick={clearAllFormData} className="clear-button">
          🗑️ Clear All Data
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {/* === Bagian 1: Form Lab PB === */}
        <div className="section">
          <h3 className="section-title">⚙️ Data Utama</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Timestamp:</label>
              <input 
                type="datetime-local" 
                name="timestamp" 
                value={formData.timestamp} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Board No:</label>
              <input 
                name="board_no" 
                value={formData.board_no} 
                onChange={handleChange} 
                required 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Set Weight:</label>
              <input 
                type="number" 
                step="0.1" 
                name="set_weight" 
                value={formData.set_weight} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Shift/Group:</label>
              <select 
                name="shift_group" 
                value={formData.shift_group} 
                onChange={handleChange} 
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
                value={formData.tested_by} 
                onChange={handleChange} 
                required 
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
                value={formData.density_min} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Density Max:</label>
              <input 
                type="number" 
                step="0.01" 
                name="density_max" 
                value={formData.density_max} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Board Type:</label>
              <input 
                name="board_type" 
                value={formData.board_type} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Glue SL:</label>
              <input 
                type="text" 
                name="glue_sl" 
                value={formData.glue_sl} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Glue CL:</label>
              <input 
                type="text" 
                name="glue_cl" 
                value={formData.glue_cl} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thick Min:</label>
              <input 
                type="number" 
                step="0.1" 
                name="thick_min" 
                value={formData.thick_min} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thick Max:</label>
              <input 
                type="number" 
                step="0.1" 
                name="thick_max" 
                value={formData.thick_max} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
          </div>

          <h4 className="sub-section-title">📊 Data Sample (24 pcs)</h4>
          <SampleTable
            samples={samples}
            onSamplesChange={setSamples}
          />

        </div>

        {/* === Bagian 2: Internal Bonding === */}
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
                        value={ibData[`ib_${pos}`]} 
                        onChange={handleIbChange} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.1" 
                        name={`density_${pos}`} 
                        value={ibData[`density_${pos}`]} 
                        onChange={handleIbChange} 
                        className="input-table"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(ibAvg)}</td>
                  <td>{formatNumber(densityAvgIb)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === Bagian 3: Bending Strange === */}
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
                        onChange={handleBsChange} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.1" 
                        name={`density_${pos}`} 
                        value={bsData[`density_${pos}`]} 
                        onChange={handleBsChange} 
                        className="input-table"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="table-row-bold">
                  <td>AVG</td>
                  <td>{formatNumber(morAvg)}</td>
                  <td>{formatNumber(densityAvgBs)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === Bagian 4: Screw Test === */}
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
                        onChange={handleScrewChange} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01" 
                        name={`edge_${pos}`} 
                        value={screwData[`edge_${pos}`]} 
                        onChange={handleScrewChange} 
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

        {/* === Bagian 5: Density Profile === */}
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
                  <td><input type="number" step="0.1" name="max_top_le" value={densityProfileData.max_top_le} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_top_ml" value={densityProfileData.max_top_ml} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_top_md" value={densityProfileData.max_top_md} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_top_mr" value={densityProfileData.max_top_mr} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_top_ri" value={densityProfileData.max_top_ri} onChange={handleDensityProfileChange} className="input-table" /></td>
                </tr>
                <tr>
                  <td>MAX BOT [kg/m³]</td>
                  <td><input type="number" step="0.1" name="max_bot_le" value={densityProfileData.max_bot_le} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_bot_ml" value={densityProfileData.max_bot_ml} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_bot_md" value={densityProfileData.max_bot_md} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_bot_mr" value={densityProfileData.max_bot_mr} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="max_bot_ri" value={densityProfileData.max_bot_ri} onChange={handleDensityProfileChange} className="input-table" /></td>
                </tr>
                <tr>
                  <td>MIN [kg/m³]</td>
                  <td><input type="number" step="0.1" name="min_le" value={densityProfileData.min_le} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="min_ml" value={densityProfileData.min_ml} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="min_md" value={densityProfileData.min_md} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="min_mr" value={densityProfileData.min_mr} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="min_ri" value={densityProfileData.min_ri} onChange={handleDensityProfileChange} className="input-table" /></td>
                </tr>
                <tr>
                  <td>MEAN [kg/m³]</td>
                  <td><input type="number" step="0.1" name="mean_le" value={densityProfileData.mean_le} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="mean_ml" value={densityProfileData.mean_ml} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="mean_md" value={densityProfileData.mean_md} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="mean_mr" value={densityProfileData.mean_mr} onChange={handleDensityProfileChange} className="input-table" /></td>
                  <td><input type="number" step="0.1" name="mean_ri" value={densityProfileData.mean_ri} onChange={handleDensityProfileChange} className="input-table" /></td>
                </tr>
                <tr className="table-row-bold">
                  <td>MIN/MEAN [%]</td>
                  <td>{formatNumber(minMeanLe)}</td>
                  <td>{formatNumber(minMeanMl)}</td>
                  <td>{formatNumber(minMeanMd)}</td>
                  <td>{formatNumber(minMeanMr)}</td>
                  <td>{formatNumber(minMeanRi)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === Bagian 6: MC Board === */}
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
                        onChange={handleMcBoardChange} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01" 
                        name={`w2_${pos}`} 
                        value={mcBoardData[`w2_${pos}`]} 
                        onChange={handleMcBoardChange} 
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
                  <td>{formatNumber(avgW1)}</td>
                  <td>{formatNumber(avgW2)}</td>
                  <td>{formatNumber(avgMC)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === Bagian 7: Swelling 2h === */}
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
                        onChange={handleSwellingChange} 
                        className="input-table"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01" 
                        name={`t2_${pos}`} 
                        value={swellingData[`t2_${pos}`]} 
                        onChange={handleSwellingChange} 
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
                  <td>{formatNumber(avgT1)}</td>
                  <td>{formatNumber(avgT2)}</td>
                  <td>{formatNumber(avgTs)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === Bagian 8: Surface Soundness === */}
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
                        onChange={handleSurfaceChange} 
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

        {/* === Bagian 9: Tebal Flakes === */}
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
                      onChange={handleTebalFlakesChange} 
                      className="input-table"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === Bagian 10: Cons Hardener === */}
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
                      onChange={handleConsHardenerChange} 
                      className="input-table"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* === Bagian 11: Geltime Glue Mix === */}
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
                      onChange={handleGeltimeChange} 
                      className="input-table"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="1" 
                      name="cl" 
                      value={geltimeData.cl} 
                      onChange={handleGeltimeChange} 
                      className="input-table"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button type="submit" className="submit-button">
          Kirim Laporan
        </button>
        <button type="button" onClick={clearAllFormData} className="clear-button-secondary">
            🗑️ Clear Form
        </button>
      </form>
    </div>
  );
}