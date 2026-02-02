// Hitung average Internal Bonding
export const calculateIbAverage = (ibData) => {
  return (
    (parseFloat(ibData.ib_le) || 0) +
    (parseFloat(ibData.ib_ml) || 0) +
    (parseFloat(ibData.ib_md) || 0) +
    (parseFloat(ibData.ib_mr) || 0) +
    (parseFloat(ibData.ib_ri) || 0)
  ) / 5;
};

export const calculateDensityAverageIb = (ibData) => {
  return (
    (parseFloat(ibData.density_le) || 0) +
    (parseFloat(ibData.density_ml) || 0) +
    (parseFloat(ibData.density_md) || 0) +
    (parseFloat(ibData.density_mr) || 0) +
    (parseFloat(ibData.density_ri) || 0)
  ) / 5;
};

// Hitung average Bending Strange
export const calculateMorAverage = (bsData) => {
  return (
    (parseFloat(bsData.mor_le) || 0) +
    (parseFloat(bsData.mor_ml) || 0) +
    (parseFloat(bsData.mor_md) || 0) +
    (parseFloat(bsData.mor_mr) || 0) +
    (parseFloat(bsData.mor_ri) || 0)
  ) / 5;
};

export const calculateDensityAverageBs = (bsData) => {
  return (
    (parseFloat(bsData.density_le) || 0) +
    (parseFloat(bsData.density_ml) || 0) +
    (parseFloat(bsData.density_md) || 0) +
    (parseFloat(bsData.density_mr) || 0) +
    (parseFloat(bsData.density_ri) || 0)
  ) / 5;
};

// Hitung average Screw Test
export const calculateFaceAverage = (screwData) => {
  return (
    (parseFloat(screwData.face_le) || 0) +
    (parseFloat(screwData.face_ml) || 0) +
    (parseFloat(screwData.face_md) || 0) +
    (parseFloat(screwData.face_mr) || 0) +
    (parseFloat(screwData.face_ri) || 0)
  ) / 5;
};

export const calculateEdgeAverage = (screwData) => {
  return (
    (parseFloat(screwData.edge_le) || 0) +
    (parseFloat(screwData.edge_ml) || 0) +
    (parseFloat(screwData.edge_md) || 0) +
    (parseFloat(screwData.edge_mr) || 0) +
    (parseFloat(screwData.edge_ri) || 0)
  ) / 5;
};

// Hitung MIN/MEAN [%]
export const calculateMinMean = (minValue, meanValue) => {
  const minNum = parseFloat(minValue);
  const meanNum = parseFloat(meanValue);
  return minNum && meanNum ? (minNum / meanNum) * 100 : null;
};

// Hitung MC [%] = (W1 - W2) / W2 * 100
export const calculateMC = (w1, w2) => {
  const w1Num = parseFloat(w1) || 0;
  const w2Num = parseFloat(w2) || 0;
  return w2Num > 0 ? ((w1Num - w2Num) / w2Num) * 100 : null;
};

export const calculateMcAverage = (mcBoardData) => {
  const positions = ['le', 'ml', 'md', 'mr', 'ri'];
  const mcValues = positions.map(pos => 
    calculateMC(mcBoardData[`w1_${pos}`], mcBoardData[`w2_${pos}`]) || 0
  );
  return mcValues.reduce((sum, val) => sum + val, 0) / positions.length;
};

export const calculateW1Average = (mcBoardData) => {
  const positions = ['le', 'ml', 'md', 'mr', 'ri'];
  const w1Values = positions.map(pos => parseFloat(mcBoardData[`w1_${pos}`]) || 0);
  return w1Values.reduce((sum, val) => sum + val, 0) / positions.length;
};

export const calculateW2Average = (mcBoardData) => {
  const positions = ['le', 'ml', 'md', 'mr', 'ri'];
  const w2Values = positions.map(pos => parseFloat(mcBoardData[`w2_${pos}`]) || 0);
  return w2Values.reduce((sum, val) => sum + val, 0) / positions.length;
};

// Hitung TS [%] = (T2 - T1) / T1 * 100
export const calculateTS = (t1, t2) => {
  const t1Num = parseFloat(t1) || 0;
  const t2Num = parseFloat(t2) || 0;
  return t1Num > 0 ? ((t2Num - t1Num) / t1Num) * 100 : null;
};

export const calculateTsAverage = (swellingData) => {
  const positions = ['le', 'ml', 'md', 'mr', 'ri'];
  const tsValues = positions.map(pos => 
    calculateTS(swellingData[`t1_${pos}`], swellingData[`t2_${pos}`]) || 0
  );
  return tsValues.reduce((sum, val) => sum + val, 0) / positions.length;
};

export const calculateT1Average = (swellingData) => {
  const positions = ['le', 'ml', 'md', 'mr', 'ri'];
  const t1Values = positions.map(pos => parseFloat(swellingData[`t1_${pos}`]) || 0);
  return t1Values.reduce((sum, val) => sum + val, 0) / positions.length;
};

export const calculateT2Average = (swellingData) => {
  const positions = ['le', 'ml', 'md', 'mr', 'ri'];
  const t2Values = positions.map(pos => parseFloat(swellingData[`t2_${pos}`]) || 0);
  return t2Values.reduce((sum, val) => sum + val, 0) / positions.length;
};

// Hitung AVG Surface Soundness
export const calculateSurfaceAverage = (surfaceSoundnessData) => {
  return (
    (parseFloat(surfaceSoundnessData.t1_le_surface) || 0) +
    (parseFloat(surfaceSoundnessData.t1_ri_surface) || 0)
  ) / 2;
};

// Helper untuk format angka
export const formatNumber = (value, decimals = 2) => {
  return value !== null && !isNaN(value) ? value.toFixed(decimals) : '-';
};