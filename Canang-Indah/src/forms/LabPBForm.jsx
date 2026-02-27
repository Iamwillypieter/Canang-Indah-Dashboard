import { useState } from 'react';
import './LabPBForm.css';
import { useLabPBFormData } from '../hooks/useLabPBFormData';
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
} from '../utils/calculations.js';

import DataUtamaSection from '../sections/DataUtamaSection.jsx';
import InternalBondingSection from '../sections/InternalBondingSection.jsx';
import BendingStrangeSection from '../sections/BendingStrangeSection';
import ScrewTestSection from '../sections/ScrewTestSection';
import DensityProfileSection from '../sections/DensityProfileSection';
import McBoardSection from '../sections/McBoardSection';
import SwellingSection from '../sections/SwellingSection';
import SurfaceSoundnessSection from '../sections/SurfaceSoundnessSection';
import TebalFlakesSection from '../sections/TebalFlakesSection';
import ConsHardenerSection from '../sections/ConsHardenerSection';
import GeltimeSection from '../sections/GeltimeSection';

export default function LabPBForm() {
  console.log('✅ LabPBForm dirender!');

  const {
    formData,
    setFormData,
    ibData,
    setIbData,
    bsData,
    setBsData,
    screwData,
    setScrewData,
    densityProfileData,
    setDensityProfileData,
    mcBoardData,
    setMcBoardData,
    swellingData,
    setSwellingData,
    surfaceSoundnessData,
    setSurfaceSoundnessData,
    tebalFlakesData,
    setTebalFlakesData,
    consHardenerData,
    setConsHardenerData,
    geltimeData,
    setGeltimeData,
    samples,
    setSamples,
    clearAllFormData
  } = useLabPBFormData();

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 Handler khusus untuk tagName (opsional, bisa pakai handleChange biasa)
  const handleTagNameChange = (value) => {
    setFormData(prev => ({ ...prev, tagName: value }));
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

  // Calculations
  const ibAvg = calculateIbAverage(ibData);
  const densityAvgIb = calculateDensityAverageIb(ibData);
  const morAvg = calculateMorAverage(bsData);
  const densityAvgBs = calculateDensityAverageBs(bsData);
  const faceAvg = calculateFaceAverage(screwData);
  const edgeAvg = calculateEdgeAverage(screwData);
  const minMeanValues = {
    le: calculateMinMean(densityProfileData.min_le, densityProfileData.mean_le),
    ml: calculateMinMean(densityProfileData.min_ml, densityProfileData.mean_ml),
    md: calculateMinMean(densityProfileData.min_md, densityProfileData.mean_md),
    mr: calculateMinMean(densityProfileData.min_mr, densityProfileData.mean_mr),
    ri: calculateMinMean(densityProfileData.min_ri, densityProfileData.mean_ri)
  };
  const mcValues = {
    le: calculateMC(mcBoardData.w1_le, mcBoardData.w2_le),
    ml: calculateMC(mcBoardData.w1_ml, mcBoardData.w2_ml),
    md: calculateMC(mcBoardData.w1_md, mcBoardData.w2_md),
    mr: calculateMC(mcBoardData.w1_mr, mcBoardData.w2_mr),
    ri: calculateMC(mcBoardData.w1_ri, mcBoardData.w2_ri)
  };
  const avgW1 = calculateW1Average(mcBoardData);
  const avgW2 = calculateW2Average(mcBoardData);
  const avgMC = calculateMcAverage(mcBoardData);
  const tsValues = {
    le: calculateTS(swellingData.t1_le, swellingData.t2_le),
    ml: calculateTS(swellingData.t1_ml, swellingData.t2_ml),
    md: calculateTS(swellingData.t1_md, swellingData.t2_md),
    mr: calculateTS(swellingData.t1_mr, swellingData.t2_mr),
    ri: calculateTS(swellingData.t1_ri, swellingData.t2_ri)
  };
  const avgT1 = calculateT1Average(swellingData);
  const avgT2 = calculateT2Average(swellingData);
  const avgTs = calculateTsAverage(swellingData);
  const avgSurface = calculateSurfaceAverage(surfaceSoundnessData);

  // Submit Handler
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
      const payload = {
        tag_name: formData.tagName,
        board_no: formData.board_no,
        timestamp: new Date(formData.timestamp).toISOString(),
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
      
      <form onSubmit={handleSubmit}>
        <DataUtamaSection 
          formData={formData} 
          samples={samples} 
          onChange={handleChange} 
          onSamplesChange={setSamples} 
          tagName={formData.tagName}           // 👈 Oper value tagName
          onTagNameChange={handleTagNameChange}
        />
        
        <InternalBondingSection 
          ibData={ibData} 
          onChange={handleIbChange} 
          ibAvg={ibAvg} 
          densityAvg={densityAvgIb} 
        />
        
        <BendingStrangeSection 
          bsData={bsData} 
          onChange={handleBsChange} 
          morAvg={morAvg} 
          densityAvg={densityAvgBs} 
        />
        
        <ScrewTestSection 
          screwData={screwData} 
          onChange={handleScrewChange} 
          faceAvg={faceAvg} 
          edgeAvg={edgeAvg} 
        />
        
        <DensityProfileSection 
          densityProfileData={densityProfileData} 
          onChange={handleDensityProfileChange} 
          minMeanValues={minMeanValues} 
        />
        
        <McBoardSection 
          mcBoardData={mcBoardData} 
          onChange={handleMcBoardChange} 
          mcValues={mcValues} 
          avgW1={avgW1} 
          avgW2={avgW2} 
          avgMC={avgMC} 
        />
        
        <SwellingSection 
          swellingData={swellingData} 
          onChange={handleSwellingChange} 
          tsValues={tsValues} 
          avgT1={avgT1} 
          avgT2={avgT2} 
          avgTs={avgTs} 
        />
        
        <SurfaceSoundnessSection 
          surfaceSoundnessData={surfaceSoundnessData} 
          onChange={handleSurfaceChange} 
          avgSurface={avgSurface} 
        />
        
        <TebalFlakesSection 
          tebalFlakesData={tebalFlakesData} 
          onChange={handleTebalFlakesChange} 
        />
        
        <ConsHardenerSection 
          consHardenerData={consHardenerData} 
          onChange={handleConsHardenerChange} 
        />
        
        <GeltimeSection 
          geltimeData={geltimeData} 
          onChange={handleGeltimeChange} 
        />

        <div className="button-group">
          <button type="submit" className="submit-button">
            Kirim Laporan
          </button>
          
        </div>
      </form>
    </div>
  );
}