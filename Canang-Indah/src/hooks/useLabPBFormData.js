import { useState, useEffect } from 'react';
import { useFormPersistence } from '../helper/useFormPersistence.js';

export function useLabPBFormData() {
  // Main Form Data
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

  // Internal Bonding
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

  // Bending Strange
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

  // Screw Test
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

  // Density Profile
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

  // MC Board
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
    w2_ri: ''
  });

  // Swelling 2h
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

  // Surface Soundness
  const [surfaceSoundnessData, setSurfaceSoundnessData, clearSurfaceSoundnessData] = useFormPersistence('surfaceSoundnessData', {
    t1_le_surface: '',
    t1_ri_surface: ''
  });

  // Tebal Flakes
  const [tebalFlakesData, setTebalFlakesData, clearTebalFlakesData] = useFormPersistence('tebalFlakesData', {
    avg_tebal: ''
  });

  // Cons Hardener
  const [consHardenerData, setConsHardenerData, clearConsHardenerData] = useFormPersistence('consHardenerData', {
    avg_cons: ''
  });

  // Geltime
  const [geltimeData, setGeltimeData, clearGeltimeData] = useFormPersistence('geltimeData', {
    sl: '',
    cl: ''
  });

  // Samples
  const createInitialSamples = () =>
    Array.from({ length: 24 }, (_, i) => ({
      no: i + 1,
      weight_gr: '',
      thickness_mm: '',
      length_mm: '',
      width_mm: ''
    }));

  const [samples, setSamples, clearSamplesData] = useFormPersistence('samples', createInitialSamples());

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

  return {
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
  };
}