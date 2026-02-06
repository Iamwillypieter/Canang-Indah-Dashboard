import { useState, useEffect } from "react";
import {
  initialThicknesses,
  formatDateForInput,
  calculateTotals
} from "../utils/flakesUtils";
import {
  fetchFlakesById,
  createFlakes,
  updateFlakes
} from "../services/flakesService";

export const useFlakesForm = ({ mode, documentId, navigate }) => {
  const [rows, setRows] = useState(
    initialThicknesses.map(t => ({ tebal: t, jumlah: 0 }))
  );

  const [header, setHeader] = useState({
    tanggal: "",
    jam: "",
    shift: "",
    ukuranPapan: "",
    group: "",
    jarakPisau: "",
    keterangan: "",
    pemeriksa: ""
  });

  const [isLoading, setIsLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LOAD DATA
  useEffect(() => {
    if (mode === "edit" || mode === "view") {
      loadData();
    }
  }, [mode, documentId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFlakesById(documentId);

      setHeader({
        tanggal: formatDateForInput(data.header?.tanggal),
        jam: data.header?.jam || "",
        shift: data.header?.shift || "",
        ukuranPapan: data.header?.ukuranPapan || "",
        group: data.header?.group || "",
        jarakPisau: data.header?.jarakPisau || "",
        keterangan: data.header?.keterangan || "",
        pemeriksa: data.header?.pemeriksa || ""
      });

      const map = new Map();
      data.detail?.forEach(d =>
        map.set(parseFloat(d.tebal), parseInt(d.jumlah) || 0)
      );

      setRows(
        initialThicknesses.map(t => ({
          tebal: t,
          jumlah: map.get(t) || 0
        }))
      );
    } catch (e) {
      alert("❌ Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { totalJumlah, grandTotalKetebalan, rataRata } =
      calculateTotals(rows);

    const payload = {
      header,
      detail: rows.filter(r => r.jumlah > 0),
      total_jumlah: totalJumlah,
      grand_total_ketebalan: grandTotalKetebalan,
      rata_rata: rataRata
    };

    try {
      const result =
        mode === "edit"
          ? await updateFlakes(documentId, payload)
          : await createFlakes(payload);

      alert("✅ Laporan berhasil disimpan");
      navigate(`/lab/pb/admin1/flakes/${result.documentId || documentId}`);
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    rows,
    setRows,
    header,
    setHeader,
    isLoading,
    isSubmitting,
    handleSubmit,
    ...calculateTotals(rows)
  };
};
