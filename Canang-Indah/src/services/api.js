import express from "express";
import pool from "../db.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/", async (req, res) => {
  try {
    const {
      header,
      detail,
      total_jumlah,
      grand_total_ketebalan,
      rata_rata
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO flakes_documents
      (header, detail, total_jumlah, grand_total_ketebalan, rata_rata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [header, detail, total_jumlah, grand_total_ketebalan, rata_rata]
    );

    res.json({ documentId: result.rows[0].id });
  } catch (err) {
    console.error("❌ FLAKES POST ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET BY ID ================= */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM flakes_documents WHERE id = $1",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ FLAKES GET ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ================= */
router.put("/:id", async (req, res) => {
  try {
    const {
      header,
      detail,
      total_jumlah,
      grand_total_ketebalan,
      rata_rata
    } = req.body;

    await pool.query(
      `
      UPDATE flakes_documents SET
        header = $1,
        detail = $2,
        total_jumlah = $3,
        grand_total_ketebalan = $4,
        rata_rata = $5,
        updated_at = NOW()
      WHERE id = $6
      `,
      [
        header,
        detail,
        total_jumlah,
        grand_total_ketebalan,
        rata_rata,
        req.params.id
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ FLAKES PUT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE ================= */
router.delete("/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM flakes_documents WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ FLAKES DELETE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;