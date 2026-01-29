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

/* =========================
   HAPUS DOKUMEN
========================= */
app.delete("/api/qc-analisa-documents/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Hapus detail rows terlebih dahulu
    await client.query(
      "DELETE FROM qc_analisa_screen WHERE document_id = $1",
      [id]
    );

    // Hapus dokumen utama
    const result = await client.query(
      "DELETE FROM qc_analisa_documents WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    await client.query("COMMIT");
    res.json({ message: "Dokumen berhasil dihapus" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR HAPUS:", err);
    res.status(500).json({ error: "Gagal menghapus dokumen" });
  } finally {
    client.release();
  }
});

/* =========================
   UPDATE QC ANALISA
========================= */
app.put("/api/qc-analisa/:id", async (req, res) => {
  const { id } = req.params;
  const { tanggal, shift_group, rows } = req.body;
  const client = await pool.connect();

  try {
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

    // Update dokumen
    await client.query(
      `UPDATE qc_analisa_documents 
       SET title = $1, tanggal = $2, shift_group = $3
       WHERE id = $4`,
      [
        `QC Analisa ${tanggal} ${shift_group}`,
        tanggal,
        shift_group,
        id
      ]
    );

    // Hapus data lama
    await client.query(
      "DELETE FROM qc_analisa_screen WHERE document_id = $1",
      [id]
    );

    // Insert data baru
    for (const row of validRows) {
      await client.query(
        `INSERT INTO qc_analisa_screen (
          document_id, tanggal, shift_group, jam, material,
          fraction_gt_8, fraction_gt_4, fraction_gt_3_15,
          fraction_gt_2, fraction_gt_1, fraction_0_5,
          fraction_0_25, fraction_lt_0_25,
          jumlah_gr, keterangan, diperiksa_oleh
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          id,
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

    res.json({
      message: "QC Analisa berhasil diperbarui",
      count: validRows.length
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR UPDATE:", err);
    res.status(500).json({ error: "Gagal memperbarui QC Analisa" });
  } finally {
    client.release();
  }
});





/* Resin Inspection Backend*/

app.post("/api/resin-inspection", async (req, res) => {
  const client = await pool.connect();
  try {
    const { date, shift, group, inspection, solidContent, comment_by, createdBy } = req.body;

    await client.query("BEGIN");

    const doc = await client.query(
      `INSERT INTO resin_inspection_documents
       (title, date, shift, group_name, comment_by, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [`Resin Inspection ${date} ${shift}`, date, shift, group, comment_by, createdBy]
    );

    const documentId = doc.rows[0].id;

    inspection.forEach((row, i) => {
      client.query(
        `INSERT INTO resin_inspection_inspection
         (document_id, load_no, cert_test_no, resin_tank, quantity,
          specific_gravity, viscosity, ph, gel_time, water_tolerance, appearance, solids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          documentId, i + 1,
          row.certTestNo, row.resinTank, row.quantity,
          row.specificGravity, row.viscosity, row.ph,
          row.gelTime, row.waterTolerance, row.appearance, row.solids
        ]
      );
    });

    solidContent.forEach(sample => {
      sample.rows.forEach((row, idx) => {
        client.query(
          `INSERT INTO resin_inspection_solids
           (document_id, sample_time, row_no, alum_foil_no,
            wt_alum_foil, wt_glue, wt_alum_foil_dry_glue,
            wt_dry_glue, solids_content, remark)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            documentId, sample.sampleTime, idx + 1,
            row.alumFoilNo, row.wtAlumFoil, row.wtGlue,
            row.wtAlumFoilDryGlue, row.wtDryGlue,
            row.solidsContent, row.remark
          ]
        );
      });
    });

    await client.query("COMMIT");
    res.json({ message: "Resin Inspection tersimpan", documentId });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Gagal simpan" });
  } finally {
    client.release();
  }
});


app.get("/api/resin-inspection-documents", async (req, res) => {
  const result = await pool.query(
    `SELECT id, title, created_at FROM resin_inspection_documents ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

app.get("/api/resin-inspection/:id", async (req, res) => {
  const { id } = req.params;

  const doc = await pool.query(
    `SELECT * FROM resin_inspection_documents WHERE id=$1`, [id]
  );
  const inspection = await pool.query(
    `SELECT * FROM resin_inspection_inspection WHERE document_id=$1 ORDER BY load_no`, [id]
  );
  const solids = await pool.query(
    `SELECT * FROM resin_inspection_solids WHERE document_id=$1 ORDER BY sample_time, row_no`, [id]
  );

  res.json({
    document: doc.rows[0],
    inspection: inspection.rows,
    solidContent: solids.rows
  });
});

app.put("/api/resin-inspection/:id", async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;
  const { date, shift, group, inspection, solidContent, comment_by, createdBy } = req.body;

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE resin_inspection_documents
       SET title=$1, date=$2, shift=$3, group_name=$4,
           comment_by=$5, created_by=$6
       WHERE id=$7`,
      [`Resin Inspection ${date} ${shift}`, date, shift, group, comment_by, createdBy, id]
    );

    await client.query(`DELETE FROM resin_inspection_inspection WHERE document_id=$1`, [id]);
    await client.query(`DELETE FROM resin_inspection_solids WHERE document_id=$1`, [id]);

    inspection.forEach((row, i) => {
      client.query(
        `INSERT INTO resin_inspection_inspection
         (document_id, load_no, cert_test_no, resin_tank, quantity,
          specific_gravity, viscosity, ph, gel_time, water_tolerance, appearance, solids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          id, i + 1,
          row.certTestNo, row.resinTank, row.quantity,
          row.specificGravity, row.viscosity, row.ph,
          row.gelTime, row.waterTolerance, row.appearance, row.solids
        ]
      );
    });

    solidContent.forEach(sample => {
      sample.rows.forEach((row, idx) => {
        client.query(
          `INSERT INTO resin_inspection_solids
           (document_id, sample_time, row_no, alum_foil_no,
            wt_alum_foil, wt_glue, wt_alum_foil_dry_glue,
            wt_dry_glue, solids_content, remark)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            id, sample.sampleTime, idx + 1,
            row.alumFoilNo, row.wtAlumFoil, row.wtGlue,
            row.wtAlumFoilDryGlue, row.wtDryGlue,
            row.solidsContent, row.remark
          ]
        );
      });
    });

    await client.query("COMMIT");
    res.json({ message: "Update berhasil" });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Gagal update" });
  } finally {
    client.release();
  }
});

app.delete("/api/resin-inspection-documents/:id", async (req, res) => {
  await pool.query(`DELETE FROM resin_inspection_documents WHERE id=$1`, [req.params.id]);
  res.json({ message: "Dokumen dihapus" });
});




/* =========================
   FLAKES DOCUMENTS API
========================= */

// CREATE - Simpan Flakes Document Baru
app.post("/api/flakes-documents", async (req, res) => {
  const client = await pool.connect();
  try {
    const { header, detail, total_jumlah, grand_total_ketebalan, rata_rata } = req.body;

    // Validasi input
    if (!header || !detail || detail.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    if (!header.tanggal) {
      return res.status(400).json({ error: "Tanggal harus diisi" });
    }

    await client.query("BEGIN");

    try {
      // 1️⃣ Insert dokumen utama
      const docResult = await client.query(
        `INSERT INTO flakes_documents (title, created_at, updated_at)
         VALUES ($1, NOW(), NOW())
         RETURNING id`,
        [`Flakes ${header.tanggal}`]
      );

      const documentId = docResult.rows[0].id;

      // 2️⃣ Insert header
      await client.query(
        `INSERT INTO flakes_header (
          document_id, tanggal, jam, shift, ukuran_papan, 
          "group", jarak_pisau, keterangan, pemeriksa, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          documentId,
          header.tanggal,
          header.jam || null,
          header.shift || null,
          header.ukuranPapan || null,
          header.group || null,
          header.jarakPisau || null,
          header.keterangan || null,
          header.pemeriksa || null
        ]
      );

      // 3️⃣ Insert detail rows
      for (const row of detail) {
        await client.query(
          `INSERT INTO flakes_detail (document_id, tebal, jumlah, total_ketebalan, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            documentId,
            parseFloat(row.tebal) || 0,
            parseInt(row.jumlah) || 0,
            parseFloat(row.tebal * row.jumlah) || 0
          ]
        );
      }

      // 4️⃣ Insert summary
      await client.query(
        `INSERT INTO flakes_summary (
          document_id, total_jumlah, grand_total_ketebalan, rata_rata_ketebalan, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [
          documentId,
          parseInt(total_jumlah) || 0,
          parseFloat(grand_total_ketebalan) || 0,
          parseFloat(rata_rata) || 0
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Flakes document berhasil disimpan",
        documentId,
        success: true
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

  } catch (err) {
    console.error("❌ ERROR CREATE FLAKES:", err);
    res.status(500).json({ 
      error: "Gagal menyimpan Flakes document",
      message: err.message 
    });
  } finally {
    client.release();
  }
});

// READ - List semua Flakes documents
app.get("/api/flakes-documents", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fd.id, 
        fd.title, 
        fd.created_at,
        fh.tanggal,
        fh.shift,
        fh."group"
      FROM flakes_documents fd
      LEFT JOIN flakes_header fh ON fd.id = fh.document_id
      ORDER BY fd.created_at DESC
    `);

    const documents = result.rows.map(doc => ({
      id: doc.id,
      title: doc.title || `Flakes ${doc.tanggal ? new Date(doc.tanggal).toLocaleDateString('id-ID') : 'Baru'}`,
      created_at: doc.created_at,
      tanggal: doc.tanggal,
      shift: doc.shift,
      group: doc.group,
      type: "flakes"
    }));

    res.json(documents);
  } catch (err) {
    console.error("❌ ERROR GET FLAKES LIST:", err);
    res.status(500).json({ error: "Gagal memuat daftar Flakes" });
  }
});

// READ - Detail Flakes document
app.get("/api/flakes-documents/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Get document info
    const docResult = await pool.query(
      `SELECT fd.*, fh.*
       FROM flakes_documents fd
       LEFT JOIN flakes_header fh ON fd.id = fh.document_id
       WHERE fd.id = $1`,
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const doc = docResult.rows[0];

    // Get detail
    const detailResult = await pool.query(
      `SELECT * FROM flakes_detail 
       WHERE document_id = $1 
       ORDER BY tebal ASC`,
      [id]
    );

    // Get summary
    const summaryResult = await pool.query(
      `SELECT * FROM flakes_summary 
       WHERE document_id = $1`,
      [id]
    );

    const header = {
      tanggal: doc.tanggal,
      jam: doc.jam,
      shift: doc.shift,
      ukuranPapan: doc.ukuran_papan,
      group: doc.group,
      jarakPisau: doc.jarak_pisau,
      keterangan: doc.keterangan,
      pemeriksa: doc.pemeriksa
    };

    const detail = detailResult.rows.map(row => ({
      tebal: parseFloat(row.tebal),
      jumlah: parseInt(row.jumlah),
      total_ketebalan: parseFloat(row.total_ketebalan)
    }));

    const summary = summaryResult.rows[0] || {};

    res.json({
      id: parseInt(id),
      header,
      detail,
      summary: {
        total_jumlah: summary.total_jumlah || 0,
        grand_total_ketebalan: summary.grand_total_ketebalan || 0,
        rata_rata: summary.rata_rata_ketebalan || 0
      }
    });

  } catch (err) {
    console.error("❌ ERROR GET FLAKES DETAIL:", err);
    res.status(500).json({ error: "Gagal memuat detail Flakes" });
  }
});

// UPDATE - Update Flakes document
app.put("/api/flakes-documents/:id", async (req, res) => {
  const { id } = req.params;
  const { header, detail, total_jumlah, grand_total_ketebalan, rata_rata } = req.body;
  const client = await pool.connect();

  try {
    if (!header || !detail || detail.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    await client.query("BEGIN");

    try {
      // Update header
      await client.query(
        `UPDATE flakes_header SET
          tanggal = $1, jam = $2, shift = $3, ukuran_papan = $4,
          "group" = $5, jarak_pisau = $6, keterangan = $7, pemeriksa = $8,
          created_at = NOW()
         WHERE document_id = $9`,
        [
          header.tanggal,
          header.jam || null,
          header.shift || null,
          header.ukuranPapan || null,
          header.group || null,
          header.jarakPisau || null,
          header.keterangan || null,
          header.pemeriksa || null,
          parseInt(id)
        ]
      );

      // Delete old detail
      await client.query(
        `DELETE FROM flakes_detail WHERE document_id = $1`,
        [parseInt(id)]
      );

      // Insert new detail
      for (const row of detail) {
        await client.query(
          `INSERT INTO flakes_detail (document_id, tebal, jumlah, total_ketebalan, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            parseInt(id),
            parseFloat(row.tebal) || 0,
            parseInt(row.jumlah) || 0,
            parseFloat(row.tebal * row.jumlah) || 0
          ]
        );
      }

      // Update summary
      const summaryCheck = await client.query(
        `SELECT id FROM flakes_summary WHERE document_id = $1`,
        [parseInt(id)]
      );

      if (summaryCheck.rows.length > 0) {
        await client.query(
          `UPDATE flakes_summary SET
            total_jumlah = $1, 
            grand_total_ketebalan = $2, 
            rata_rata_ketebalan = $3,
            created_at = NOW()
           WHERE document_id = $4`,
          [
            parseInt(total_jumlah) || 0,
            parseFloat(grand_total_ketebalan) || 0,
            parseFloat(rata_rata) || 0,
            parseInt(id)
          ]
        );
      } else {
        await client.query(
          `INSERT INTO flakes_summary (
            document_id, total_jumlah, grand_total_ketebalan, rata_rata_ketebalan, created_at
          ) VALUES ($1, $2, $3, $4, NOW())`,
          [
            parseInt(id),
            parseInt(total_jumlah) || 0,
            parseFloat(grand_total_ketebalan) || 0,
            parseFloat(rata_rata) || 0
          ]
        );
      }

      // Update document title
      await client.query(
        `UPDATE flakes_documents SET
          title = $1,
          updated_at = NOW()
         WHERE id = $2`,
        [`Flakes ${header.tanggal}`, parseInt(id)]
      );

      await client.query("COMMIT");

      res.json({
        message: "Flakes document berhasil diperbarui",
        success: true
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

  } catch (err) {
    console.error("❌ ERROR UPDATE FLAKES:", err);
    res.status(500).json({ 
      error: "Gagal memperbarui Flakes document",
      message: err.message 
    });
  } finally {
    client.release();
  }
});

// DELETE - Hapus Flakes document
app.delete("/api/flakes-documents/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Delete dari tabel yang punya foreign key terlebih dahulu
    await client.query(`DELETE FROM flakes_summary WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM flakes_detail WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM flakes_header WHERE document_id = $1`, [id]);

    // Delete dokumen utama
    const result = await client.query(
      `DELETE FROM flakes_documents WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    await client.query("COMMIT");

    res.json({ 
      message: "Flakes document berhasil dihapus",
      success: true 
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR DELETE FLAKES:", err);
    res.status(500).json({ error: "Gagal menghapus Flakes document" });
  } finally {
    client.release();
  }
});



app.listen(3001, () =>
  console.log("✅ Backend running on port 3001")
);
