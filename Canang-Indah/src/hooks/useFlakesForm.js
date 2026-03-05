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
  /* ================= HELPERS ================= */
  // Fungsi untuk mengambil data user dari local storage secara aman
  const getSavedUser = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      return savedUser || null;
    } catch (e) {
      return null;
    }
  };

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

    // 1. Cek Draft di LocalStorage
    if (mode === "create") {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Pastikan shift di draft tidak kosong, jika kosong lanjut ke fallback
          if (parsed.header && (parsed.header.shift)) {
            return { ...defaultHeader, ...parsed.header };
          }
        } catch (e) {}
      }

      // 2. Fallback: Ambil dari userInfo props atau localStorage user
      const user = userInfo || getSavedUser();
      if (user?.shift) {
        return {
          ...defaultHeader,
          shift: user.shift.toString().trim(),
          group: (user.group || "").toString().trim()
        };
      }
    }

    return defaultHeader;
  });

  const [isLoading, setIsLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= MEMO: TOTALS ================= */
  const totals = useMemo(() => calculateTotals(rows), [rows]);

  /* ================= AUTO-FILL SYNC ================= */
  // Sinkronisasi ulang jika userInfo baru tersedia setelah komponen mounting
  useEffect(() => {
    if (mode === "create" && userInfo?.shift) {
      setHeader(prev => {
        // Hanya update jika shift di state saat ini benar-benar kosong
        if (!prev.shift) {
          return {
            ...prev,
            shift: userInfo.shift.toString().trim(),
            group: (userInfo.group || "").toString().trim()
          };
        }
        return prev;
      });
    }
  }, [mode, userInfo]);

  /* ================= AUTO SAVE DRAFT ================= */
  useEffect(() => {
    if (mode === "create") {
      const timer = setTimeout(() => {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ rows, header })
        );
      }, 500); // Debounce agar tidak terlalu sering menulis ke disk
      return () => clearTimeout(timer);
    }
  }, [rows, header, mode]);

  /* ================= LOAD DATA (EDIT/VIEW) ================= */
  const loadData = useCallback(async () => {
    if (!documentId) return;
    setIsLoading(true);
    try {
      const data = await fetchFlakesById(documentId);
      
      const rawHeader = data.header || data;
      setHeader({
        tagName: data.tag_name || data.tagName || rawHeader?.tag_name || "",
        tanggal: formatDateForInput(rawHeader?.tanggal),
        jam: rawHeader?.jam || "",
        shift: rawHeader?.shift || "",
        ukuranPapan: rawHeader?.ukuranPapan || "",
        group: rawHeader?.group || "",
        jarakPisau: rawHeader?.jarakPisau || "",
        keterangan: rawHeader?.keterangan || "",
        pemeriksa: rawHeader?.pemeriksa || ""
      });

      const detailData = data.detail || [];
      const detailMap = new Map();
      detailData.forEach(d => {
        detailMap.set(parseFloat(d.tebal), parseInt(d.jumlah) || 0);
      });

      setRows(initialThicknesses.map(t => ({
        tebal: t,
        jumlah: detailMap.get(t) || 0
      })));
    } catch (e) {
      console.error("💥 Load error:", e);
      alert("❌ Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && documentId) {
      loadData();
    }
  }, [mode, documentId, loadData]);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    // Re-check source data jika header.shift kosong (Defense mechanism)
    let currentShift = header.shift;
    
    if (!currentShift && mode === "create") {
      const backupUser = userInfo || getSavedUser();
      if (backupUser?.shift) {
        currentShift = backupUser.shift;
        setHeader(prev => ({ ...prev, shift: backupUser.shift, group: backupUser.group || "" }));
      }
    }

    if (!currentShift || currentShift.toString().trim() === "") {
      alert("⚠ Data shift tidak ditemukan. Silakan login ulang atau pastikan koneksi stabil.");
      return false;
    }

    if (!header.tanggal) {
      alert("⚠ Tanggal wajib diisi");
      return false;
    }

    if (totals.totalJumlah <= 0) {
      alert("⚠ Jumlah flakes masih kosong. Masukkan minimal satu data.");
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

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
      const result = mode === "edit"
          ? await updateFlakes(documentId, payload)
          : await createFlakes(payload);

      const generatedTag = result?.tag_name || result?.tagName;
      alert(mode === "create" 
        ? `✅ Laporan berhasil disimpan!\n🏷️ Tag: ${generatedTag}` 
        : "✅ Laporan berhasil diperbarui");

      localStorage.removeItem(STORAGE_KEY);
      const targetId = result?.documentId || result?.id || documentId;
      navigate(`/lab/pb/admin1/flakes/${targetId}`);
      
    } catch (e) {
      console.error("💥 Submit error:", e);
      alert(`❌ Gagal menyimpan: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, documentId, header, rows, totals, navigate, validateForm]);

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