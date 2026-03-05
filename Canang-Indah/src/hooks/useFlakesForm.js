import { useState, useEffect, useMemo, useCallback } from "react";
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

export const useFlakesForm = ({ mode, documentId, navigate, userInfo = null }) => {
  /* ================= STATE: ROWS ================= */
  const [rows, setRows] = useState(() => {
    if (mode === "create") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.rows)) return parsed.rows;
        } catch (e) {
          console.error("❌ Error parsing saved rows:", e);
        }
      }
    }
    return initialThicknesses.map(t => ({ tebal: t, jumlah: 0 }));
  });

  /* ================= STATE: HEADER ================= */
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
          console.error("❌ Error parsing saved header:", e);
        }
      }
    }

    return defaultHeader;
  });

  const [isLoading, setIsLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= MEMO: TOTALS ================= */
  const totals = useMemo(() => calculateTotals(rows), [rows]);

  /* ================= AUTO-FILL SHIFT & GROUP FROM USER INFO ================= */
  useEffect(() => {
    if (mode === "create" && userInfo) {
      // ✅ Fix: Cek shift !== undefined, dan group boleh empty string ""
      const userShift = userInfo.shift;
      const userGroup = userInfo.group !== undefined ? userInfo.group : "";
      
      if (userShift !== undefined && userShift !== null) {
        setHeader(prev => ({
          ...prev,
          shift: userShift,
          group: userGroup
        }));
      }
    }
  }, [mode, userInfo]);

  /* ================= AUTO SAVE ================= */
  useEffect(() => {
    if (mode === "create") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ rows, header })
      );
    }
  }, [rows, header, mode]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && documentId) {
      loadData();
    }
  }, [mode, documentId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFlakesById(documentId);

      /* ===== HEADER MAPPING ===== */
      setHeader({
        tagName:
          data.tag_name ||
          data.tagName ||
          data.header?.tag_name ||
          data.header?.tagName ||
          "",
        tanggal: formatDateForInput(data.header?.tanggal),
        jam: data.header?.jam || "",
        shift: data.header?.shift || "",
        ukuranPapan: data.header?.ukuranPapan || "",
        group: data.header?.group || "",
        jarakPisau: data.header?.jarakPisau || "",
        keterangan: data.header?.keterangan || "",
        pemeriksa: data.header?.pemeriksa || ""
      });

      /* ===== DETAIL → ROWS ===== */
      const detailMap = new Map();

      (data.detail || []).forEach(d => {
        const tebal = parseFloat(d.tebal);
        const jumlah = parseInt(d.jumlah) || 0;
        detailMap.set(tebal, jumlah);
      });

      setRows(
        initialThicknesses.map(t => ({
          tebal: t,
          jumlah: detailMap.get(t) || 0
        }))
      );
    } catch (e) {
      console.error("💥 Load error:", e);
      alert("❌ Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    // ✅ Hanya validasi shift (group boleh kosong)
    if (mode === "create" && (!header.shift || header.shift.trim() === "")) {
      // 🔁 Last resort: coba ambil dari localStorage langsung
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.shift?.trim()) {
          setHeader(prev => ({
            ...prev,
            shift: user.shift.trim(),
            group: user.group ?? ""
          }));
          console.log("🔄 Recovered shift from localStorage");
          return true; // Lanjut validasi
        }
      } catch {}
      
      alert("⚠ Data shift tidak ditemukan, silakan login ulang");
      return false;
    }

    if (!header.tanggal) {
      alert("⚠ Tanggal wajib diisi");
      return false;
    }

    if (totals.totalJumlah <= 0) {
      alert("⚠ Jumlah flakes masih kosong");
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    /* 🎯 BUILD PAYLOAD */
    const payload = {
      header: {
        tanggal: header.tanggal,
        jam: mode === "edit" ? header.jam : undefined,
        shift: header.shift,
        ukuranPapan: header.ukuranPapan,
        group: header.group,
        jarakPisau: header.jarakPisau,
        keterangan: header.keterangan,
        pemeriksa: header.pemeriksa
      },
      detail: rows
        .filter(r => r.jumlah > 0)
        .map(r => ({
          tebal: Number(r.tebal),
          jumlah: Number(r.jumlah)
        })),
      total_jumlah: totals.totalJumlah,
      grand_total_ketebalan: totals.grandTotalKetebalan,
      rata_rata: totals.rataRata
    };

    try {
      const result =
        mode === "edit"
          ? await updateFlakes(documentId, payload)
          : await createFlakes(payload);

      const generatedTag = result?.tag_name || result?.tagName;
      if (mode === "create" && generatedTag) {
        alert(`✅ Laporan berhasil disimpan!\n\n🏷️ Tag Name: ${generatedTag}`);
      } else {
        alert("✅ Laporan berhasil disimpan");
      }

      localStorage.removeItem(STORAGE_KEY);

      const targetId = result?.documentId || result?.id || documentId;

      navigate(`/lab/pb/admin1/flakes/${targetId}`, {
        state: { generatedTag: generatedTag || null }
      });
    } catch (e) {
      console.error("💥 Submit error:", e);
      alert(`❌ ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, documentId, header, rows, totals, navigate]);

  /* ================= RETURN ================= */
  return {
    rows,
    setRows,
    header,
    setHeader,
    isLoading,
    isSubmitting,
    handleSubmit,
    ...totals
  };
};