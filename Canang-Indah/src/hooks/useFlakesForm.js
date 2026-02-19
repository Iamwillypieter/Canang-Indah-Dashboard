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

const STORAGE_KEY = "flakesFormDraft";

export const useFlakesForm = ({ mode, documentId, navigate }) => {
  // 👇 STATE: rows
  const [rows, setRows] = useState(() => {
    if (mode === "create") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.rows || initialThicknesses.map(t => ({ tebal: t, jumlah: 0 }));
        } catch (e) {
          console.error('Error parsing saved rows:', e);
        }
      }
    }
    return initialThicknesses.map(t => ({ tebal: t, jumlah: 0 }));
  });

  // 👇 STATE: header (dengan tagName)
  const [header, setHeader] = useState(() => {
    const defaultHeader = {
      tagName: "",
      tanggal: "",
      jam: "",
      shift: "",
      ukuranPapan: "",
      group: "",
      jarakPisau: "",
      keterangan: "",
      pemeriksa: ""
    };

    if (mode === "create") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...defaultHeader, ...(parsed.header || {}) };
        } catch (e) {
          console.error('Error parsing saved header:', e);
        }
      }
    }
    return defaultHeader;
  });

  const [isLoading, setIsLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👇 Auto-save ke localStorage
  useEffect(() => {
    if (mode === "create") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, header }));
    }
  }, [rows, header, mode]);

  // 👇 Load data dari API
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
        // 👇 FIX: Cek tag_name di root level dulu!
        tagName: data.tag_name || data.tagName || data.header?.tag_name || data.header?.tagName || "",
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
      console.error("Load error:", e);
      alert("❌ Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { totalJumlah, grandTotalKetebalan, rataRata } = calculateTotals(rows);

    const payload = {
      tag_name: header.tagName,  // 👈 Kirim snake_case ke backend
      header: { ...header, tanggal: header.tanggal },
      detail: rows.filter(r => r.jumlah > 0),
      total_jumlah: totalJumlah,
      grand_total_ketebalan: grandTotalKetebalan,
      rata_rata: rataRata
    };

    try {
      const result = mode === "edit"
        ? await updateFlakes(documentId, payload)
        : await createFlakes(payload);

      alert("✅ Laporan berhasil disimpan");
      localStorage.removeItem(STORAGE_KEY);
      navigate(`/lab/pb/admin1/flakes/${result.documentId || documentId}`);
    } catch (e) {
      console.error("Submit error:", e);
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