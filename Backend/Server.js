import express from "express";
import cors from "cors";
import { Pool } from "pg";

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "12345",
  database: "canang_indah",
  port: 5432,
});

/* =========================
   SIMPAN QC ANALISA
========================= */
app.post("/api/qc-analisa", async (req, res) => {
  const client = await pool.connect();

  try {
    const { tanggal, shift_group, rows } = req.body;

    if (!tanggal || !shift_group || !rows || rows.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    const validRows = rows.filter(row =>
      row.jam || row.material || row.jumlah_gr
    );

    if (validRows.length === 0) {
      return res.status(400).json({ error: "Semua baris kosong" });
    }


    await client.query("BEGIN");

    // 1️⃣ insert dokumen
    const docResult = await client.query(
      `INSERT INTO qc_analisa_documents (title, tanggal, shift_group)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [
        `QC Analisa ${tanggal} ${shift_group}`,
        tanggal,
        shift_group
      ]
    );

    const documentId = docResult.rows[0].id;

    // 2️⃣ insert detail rows
    for (const row of validRows) {
      await client.query(
        `INSERT INTO qc_analisa_screen (
          document_id, tanggal, shift_group, jam, material,
          fraction_gt_8, fraction_gt_4, fraction_gt_3_15,
          fraction_gt_2, fraction_gt_1, fraction_0_5,
          fraction_0_25, fraction_lt_0_25,
          jumlah_gr, keterangan, diperiksa_oleh
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,
          $9,$10,$11,
          $12,$13,
          $14,$15,$16
        )`,
        [
          documentId,
          row.tanggal || null,
          row.shift_group || null,
          row.jam || null,
          row.material || null,
          row.fraction_gt_8 || null,
          row.fraction_gt_4 || null,
          row.fraction_gt_3_15 || null,
          row.fraction_gt_2 || null,
          row.fraction_gt_1 || null,
          row.fraction_0_5 || null,
          row.fraction_0_25 || null,
          row.fraction_lt_0_25 || null,
          row.jumlah_gr || null,
          row.keterangan || null,
          row.diperiksa_oleh || null
        ]

      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "QC Analisa berhasil disimpan",
      documentId,
      count: rows.length
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR SIMPAN:", err);
    res.status(500).json({ error: "Gagal simpan QC Analisa" });
  } finally {
    client.release();
  }
});

/* =========================
   LIST DOKUMEN
========================= */
app.get("/api/qc-analisa-documents", async (req, res) => {
  const result = await pool.query(`
    SELECT id, title, created_at
    FROM qc_analisa_documents
    ORDER BY created_at DESC
  `);

  res.json(result.rows);
});

/* =========================
   DETAIL DOKUMEN
========================= */
app.get("/api/qc-analisa/:id", async (req, res) => {
  const { id } = req.params;

  const doc = await pool.query(
    "SELECT * FROM qc_analisa_documents WHERE id=$1",
    [id]
  );

  const rows = await pool.query(
    "SELECT * FROM qc_analisa_screen WHERE document_id=$1 ORDER BY id",
    [id]
  );

  res.json({
    document: doc.rows[0],
    rows: rows.rows
  });
});

app.listen(3001, () =>
  console.log("✅ Backend running on port 3001")
);
