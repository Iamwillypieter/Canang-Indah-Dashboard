import { useState } from 'react';

export default function SampleTable({ samples = [], onSamplesChange }) {

  if (!Array.isArray(samples)) {
    return <p>⚠️ Data sample tidak valid</p>;
  }

  const handleInputChange = (index, field, value) => {
    const updatedSamples = samples.map((sample, i) =>
      i === index
        ? { ...sample, [field]: value }
        : sample
    );
    onSamplesChange(updatedSamples);
  };

  // ===============================
  // CALCULATIONS (FIXED)
  // ===============================

  const toNum = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const calculateKgPerM2 = (s) => {
    const w = toNum(s.weight_gr);
    const l = toNum(s.length_mm);
    const wd = toNum(s.width_mm);

    if (w === null || l === null || wd === null || l === 0 || wd === 0) return null;
    return (w / (l * wd)) * 1000;
  };

  const calculateDensity = (s) => {
    const w = toNum(s.weight_gr);
    const t = toNum(s.thickness_mm);
    const l = toNum(s.length_mm);
    const wd = toNum(s.width_mm);

    if (w === null || t === null || l === null || wd === null || t === 0 || l === 0 || wd === 0) return null;
    return (w / (t * l * wd)) * 1000000;
  };

  const calculateDensity155 = (density, thickness) => {
    const t = toNum(thickness);
    if (density === null || t === null || t === 0) return null;
    return (density / 15.5) * t;
  };

  // ===============================
  // STATISTICS
  // ===============================

  const getMin = (arr) => arr.length ? Math.min(...arr) : null;
  const getMax = (arr) => arr.length ? Math.max(...arr) : null;
  const getAverage = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

  const getStdDev = (arr) => {
    if (!arr.length) return null;
    const avg = getAverage(arr);
    const variance = arr.reduce((sum,v)=>sum+Math.pow(v-avg,2),0)/arr.length;
    return Math.sqrt(variance);
  };

  // ===============================
  // GLOBAL VALUES
  // ===============================

  const thicknessValues = samples.map(s => toNum(s.thickness_mm)).filter(v => v !== null);

  const kgValues = samples.map(calculateKgPerM2).filter(v => v !== null);

  const avgKg = getAverage(kgValues);

  const calculateWeightDiff = (kg) => {
    if (kg === null || avgKg === null || avgKg === 0) return null;
    return ((kg - avgKg) / avgKg) * 100;
  };

  const densityValues = samples.map(calculateDensity).filter(v => v !== null);

  const density155Values = samples.map(s => {
    const d = calculateDensity(s);
    return calculateDensity155(d, s.thickness_mm);
  }).filter(v => v !== null);

  const weightDiffValues = kgValues.map(calculateWeightDiff).filter(v => v !== null);

  // ===============================
  // RENDER
  // ===============================

  return (
    <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>No</th>
          <th>Berat [gr]</th>
          <th>Tebal [mm]</th>
          <th>Panjang [mm]</th>
          <th>Lebar [mm]</th>
          <th>100mm2 10.51 (kg/m²)</th>
          <th>DENSITY ACTUAL (kg/m3)</th>
          <th>Weight Diff. (%)</th>
          <th>Density 15.5 (kg/m3)</th>
        </tr>
      </thead>

      <tbody>
        {samples.map((s, i) => {
          const kg = calculateKgPerM2(s);
          const density = calculateDensity(s);
          const diff = calculateWeightDiff(kg);
          const d155 = calculateDensity155(density, s.thickness_mm);

          return (
            <tr key={i}>
              <td>{s.no}</td>
              <td><input value={s.weight_gr} onChange={(e)=>handleInputChange(i,"weight_gr",e.target.value)} /></td>
              <td><input value={s.thickness_mm} onChange={(e)=>handleInputChange(i,"thickness_mm",e.target.value)} /></td>
              <td><input value={s.length_mm} onChange={(e)=>handleInputChange(i,"length_mm",e.target.value)} /></td>
              <td><input value={s.width_mm} onChange={(e)=>handleInputChange(i,"width_mm",e.target.value)} /></td>

              <td>{kg !== null ? kg.toFixed(2) : ""}</td>
              <td>{density !== null ? density.toFixed(2) : ""}</td>
              <td>{diff !== null ? diff.toFixed(2) : ""}</td>
              <td>{d155 !== null ? d155.toFixed(2) : ""}</td>
            </tr>
          );
        })}

        {/* ===== SUMMARY ===== */}

        <tr style={{ background: "#f5f5f5", fontWeight: "bold", borderTop: "2px solid #999" }}>
          <td>MIN</td>
          <td></td>
          <td>{getMin(thicknessValues)?.toFixed(2)}</td>
          <td></td><td></td>
          <td>{getMin(kgValues)?.toFixed(2)}</td>
          <td>{getMin(densityValues)?.toFixed(2)}</td>
          <td>{getMin(weightDiffValues)?.toFixed(2)}</td>
          <td>{getMin(density155Values)?.toFixed(2)}</td>
        </tr>

        <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
          <td>MAX</td>
          <td></td>
          <td>{getMax(thicknessValues)?.toFixed(2)}</td>
          <td></td><td></td>
          <td>{getMax(kgValues)?.toFixed(2)}</td>
          <td>{getMax(densityValues)?.toFixed(2)}</td>
          <td>{getMax(weightDiffValues)?.toFixed(2)}</td>
          <td>{getMax(density155Values)?.toFixed(2)}</td>
        </tr>

        <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
          <td>STDEV</td>
          <td></td>
          <td>{getStdDev(thicknessValues)?.toFixed(2)}</td>
          <td></td><td></td>
          <td>{getStdDev(kgValues)?.toFixed(2)}</td>
          <td>{getStdDev(densityValues)?.toFixed(2)}</td>
          <td></td>
          <td>{getStdDev(density155Values)?.toFixed(2)}</td>
        </tr>

        <tr style={{ background: "#d4edda", fontWeight: "bold" }}>
          <td>AVG</td>
          <td></td>
          <td>{getAverage(thicknessValues)?.toFixed(2)}</td>
          <td></td><td></td>
          <td>{getAverage(kgValues)?.toFixed(2)}</td>
          <td>{getAverage(densityValues)?.toFixed(2)}</td>
          <td></td>
          <td>{getAverage(density155Values)?.toFixed(2)}</td>
        </tr>

      </tbody>
    </table>
  );
}