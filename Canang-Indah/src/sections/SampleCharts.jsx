import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";


export default function SampleCharts({ samples }) {

  // ===============================
  // 🔥 HELPER
  // ===============================
  const toNum = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const calculateKg = (s) => {
    const w = toNum(s.weight_gr);
    const l = toNum(s.length_mm);
    const wd = toNum(s.width_mm);
    if (!w || !l || !wd) return null;
    return (w / (l * wd)) * 1000;
  };

  const calculateDensity = (s) => {
    const w = toNum(s.weight_gr);
    const t = toNum(s.thickness_mm);
    const l = toNum(s.length_mm);
    const wd = toNum(s.width_mm);
    if (!w || !t || !l || !wd) return null;
    return (w / (t * l * wd)) * 1000000;
  };

  // ===============================
  // 🔥 HITUNG DATA
  // ===============================
  const kgValues = samples.map(calculateKg).filter(v => v !== null);

  const avgKg = kgValues.length
    ? kgValues.reduce((a, b) => a + b, 0) / kgValues.length
    : null;

  const chartData = samples.map((s, i) => {
    const kg = calculateKg(s);
    const density = calculateDensity(s);
    const thickness = toNum(s.thickness_mm);

    const weightDiff =
      kg && avgKg ? ((kg - avgKg) / avgKg) * 100 : null;

    return {
      no: s.no || i + 1,
      weightDiff,
      density,
      thickness
    };
  });

  // ===============================
  // 🔥 WEIGHT SUPPORT (SIMETRIS)
  // ===============================
  const weightDiffValues = chartData
    .map(d => d.weightDiff)
    .filter(v => v !== null && !isNaN(v));

  const minWeight = weightDiffValues.length
    ? Math.min(...weightDiffValues)
    : null;

  const maxWeight = minWeight !== null
    ? Math.abs(minWeight)
    : null;

  const minWeightRounded = minWeight !== null
    ? Number(minWeight.toFixed(2))
    : null;

  const maxWeightRounded = maxWeight !== null
    ? Number(maxWeight.toFixed(2))
    : null;

  // ===============================
  // 🔥 THICKNESS SUPPORT
  // ===============================
  const thicknessValues = chartData
    .map(d => d.thickness)
    .filter(v => v !== null && !isNaN(v));

  const maxThickness = thicknessValues.length
    ? Math.max(...thicknessValues)
    : null;

  const thicknessSupport = maxThickness !== null
    ? Number(maxThickness.toFixed(2))
    : null;

  const thicknessResistance = maxThickness !== null
    ? Number((maxThickness + 0.2).toFixed(2))
    : null;

  // ===============================
  // 🔥 DENSITY AREA (FIX)
  // ===============================
  const densitySupport = 630.0;
  const densityResistance = 650.0;

  // ===============================
  // 🔥 AXIS
  // ===============================
  const weightTicks = Array.from({ length: 21 }, (_, i) => -10 + i);
  const densityTicks = Array.from({ length: 21 }, (_, i) => 550 + (i * 10));
  const thicknessTicks = Array.from({ length: 10 }, (_, i) => (14.8 + i * 0.1).toFixed(2));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>

      {/* =============================== */}
      {/* WEIGHT */}
      {/* =============================== */}
      <div>
        <h3 style={{ textAlign: "center" }}>Weight Distribution (%) Chart</h3>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="no" />

            <YAxis
              domain={[-10, 10]}
              ticks={weightTicks}
              tickFormatter={(v) => v.toFixed(1)}
              interval={0}
            />

            <Tooltip formatter={(v) => v?.toFixed(2)} />

            {maxWeightRounded !== null && (
              <ReferenceLine y={maxWeightRounded} stroke="red" strokeDasharray="4 4" />
            )}

            {minWeightRounded !== null && (
              <ReferenceLine y={minWeightRounded} stroke="blue" strokeDasharray="4 4" />
            )}

            <Bar dataKey="weightDiff">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.weightDiff >= 0 ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* =============================== */}
      {/* DENSITY */}
      {/* =============================== */}
      <div>
        <h3 style={{ textAlign: "center" }}>Density (kg/m³) Chart</h3>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="no" />

            <YAxis
              domain={[550, 750]}
              ticks={densityTicks}
              tickFormatter={(v) => v.toFixed(1)}
            />

            <Tooltip formatter={(v) => v?.toFixed(2)} />

            {/* 🔥 AREA TENGAH */}
            <ReferenceLine y={densitySupport} stroke="blue" strokeDasharray="4 4" />
            <ReferenceLine y={densityResistance} stroke="red" strokeDasharray="4 4" />

            <Line type="monotone" dataKey="density" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* =============================== */}
      {/* THICKNESS */}
      {/* =============================== */}
      <div>
        <h3 style={{ textAlign: "center" }}>Thickness (mm) Chart</h3>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="no" />

            <YAxis
              domain={[14.8, 15.7]}
              ticks={thicknessTicks.map(Number)}
              tickFormatter={(v) => Number(v).toFixed(2)}
            />

            <Tooltip formatter={(v) => v?.toFixed(3)} />

            {thicknessSupport !== null && (
              <ReferenceLine y={thicknessSupport} stroke="blue" strokeDasharray="4 4" />
            )}

            {thicknessResistance !== null && (
              <ReferenceLine y={thicknessResistance} stroke="red" strokeDasharray="4 4" />
            )}

            <Bar dataKey="thickness" fill="#22c55e"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}