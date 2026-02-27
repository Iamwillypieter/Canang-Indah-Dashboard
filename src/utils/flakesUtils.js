export const initialThicknesses = [
  0.4, 0.5, 0.6, 0.7, 0.8,
  0.9, 1.0, 1.1, 1.2, 1.3,
  1.4, 1.5, 1.6, 1.7, 1.8
];

export const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const calculateTotals = (rows) => {
  const totalJumlah = rows.reduce((a, b) => a + (b.jumlah || 0), 0);
  const grandTotalKetebalan = rows.reduce(
    (a, b) => a + b.tebal * (b.jumlah || 0),
    0
  );

  const rataRata =
    totalJumlah > 0
      ? (grandTotalKetebalan / totalJumlah).toFixed(2)
      : "0.00";

  return { totalJumlah, grandTotalKetebalan, rataRata };
};
