import express from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet'; // ✅ Import helmet
import rateLimit from 'express-rate-limit'; // ✅ Import rateLimit

dotenv.config();

// Validasi environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in .env file');
  process.exit(1);
}

const app = express();

// Security middleware - SEKARANG SUDAH BISA DIGUNAKAN
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',  // ✅ Ganti jadi 5173
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection dengan error handling
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "12345",
  database: process.env.DB_NAME || "canang_indah",
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

// Rate limiting untuk auth endpoints - SEKARANG SUDAH BISA DIGUNAKAN
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.'
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Terlalu banyak percobaan login. Akun Anda terkunci sementara.'
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware untuk verifikasi token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: err.name === 'TokenExpiredError' 
          ? 'Token telah kadaluarsa' 
          : 'Token tidak valid' 
      });
    }
    req.user = user;
    next();
  });
};

// Helper function untuk validasi password strength
// Helper function untuk validasi password strength
const validatePassword = (password) => {
  const errors = [];
  
  // ✅ RELAXED VALIDATION (untuk development)
  if (password.length < 6) {
    errors.push('Password minimal 6 karakter');
  }
  
  // ❌ COMMENT OUT validasi ketat (untuk development)

  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kapital');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter spesial');
  }
  
  return errors;
};

// Route Register
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { username, password, confirmPassword, role } = req.body;
    
    // Validasi input
    if (!username || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }
    
    // Validasi username length
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username harus 3-50 karakter' });
    }
    
    // Validasi username format (hanya alphanumeric dan underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username hanya boleh mengandung huruf, angka, dan underscore' });
    }
    
    // Validasi password match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password tidak cocok' });
    }
    
    // Validasi password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Password tidak memenuhi persyaratan',
        details: passwordErrors
      });
    }
    
    // Validasi role
    if (!['admin', 'supervisor'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }
    
    // Cek username sudah ada
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert user baru
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role]
    );
    
    console.log(`✅ New user registered: ${username} (${role})`);
    
    res.status(201).json({
      message: 'Registrasi berhasil',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Server error saat registrasi' });
  }
});

// Route Login
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password diperlukan' });
    }
    
    // Cari user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      // Delay untuk timing attack prevention
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    
    const user = result.rows[0];
    
    // Verifikasi password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      // Delay untuk timing attack prevention
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ User logged in: ${username} (${user.role})`);
    
    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error saat login' });
  }
});

// Route dashboard (proteksi dengan token)
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.username} (${req.user.role})`,
    user: req.user
  });
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



/* =========================
SIMPAN LAPORAN LAB PB BARU
========================= */
app.post('/api/lab-pb', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      timestamp, board_no, set_weight, shift_group, tested_by,
      density_min, density_max, board_type, glue_sl, glue_cl,
      thick_min, thick_max, samples = [],
      ibData = {}, bsData = {}, screwData = {}, densityProfileData = {},
      mcBoardData = {}, swellingData = {}, surfaceSoundnessData = {},
      tebalFlakesData = {}, consHardenerData = {}, geltimeData = {}
    } = req.body;

    if (!board_no || !tested_by) {
      return res.status(400).json({ error: "Board No dan Tested By wajib diisi" });
    }

    await client.query('BEGIN');

    // 1️⃣ Simpan dokumen utama
    const docResult = await client.query(
      `INSERT INTO lab_pb_documents (
        timestamp, board_no, set_weight, shift_group, tested_by,
        density_min, density_max, board_type, glue_sl, glue_cl,
        thick_min, thick_max
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, board_no, timestamp`,
      [
        timestamp, board_no, set_weight || null, shift_group, tested_by,
        density_min || null, density_max || null, board_type || null, 
        glue_sl || null, glue_cl || null, thick_min || null, thick_max || null
      ]
    );
    const documentId = docResult.rows[0].id;

    // 2️⃣ Simpan samples (24 pcs)
    for (const sample of samples) {
      await client.query(
        `INSERT INTO lab_pb_samples (
          document_id, sample_no, weight_gr, thickness_mm, length_mm, width_mm
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          documentId,
          sample.no,
          sample.weight_gr || null,
          sample.thickness_mm || null,
          sample.length_mm || null,
          sample.width_mm || null
        ]
      );
    }

    // 3️⃣ Simpan Internal Bonding
    const positions = ['le', 'ml', 'md', 'mr', 'ri'];
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_internal_bonding (
          document_id, position, ib_value, density_value, avg_ib, avg_density
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          documentId,
          pos,
          ibData[`ib_${pos}`] || null,
          ibData[`density_${pos}`] || null,
          ibData.ib_avg || null,
          ibData.density_avg || null
        ]
      );
    }

    // 4️⃣ Simpan Bending Strength
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_bending_strength (
          document_id, position, mor_value, density_value, avg_mor, avg_density
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          documentId,
          pos,
          bsData[`mor_${pos}`] || null,
          bsData[`density_${pos}`] || null,
          bsData.mor_avg || null,
          bsData.bs_density_avg || null
        ]
      );
    }

    // 5️⃣ Simpan Screw Test
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_screw_test (
          document_id, position, face_value, edge_value, avg_face, avg_edge
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          documentId,
          pos,
          screwData[`face_${pos}`] || null,
          screwData[`edge_${pos}`] || null,
          screwData.face_avg || null,
          screwData.edge_avg || null
        ]
      );
    }

    // 6️⃣ Simpan Density Profile
    for (const pos of positions) {
      const min = densityProfileData[`min_${pos}`];
      const mean = densityProfileData[`mean_${pos}`];
      const minMeanRatio = min && mean ? (parseFloat(min) / parseFloat(mean) * 100) : null;

      await client.query(
        `INSERT INTO lab_pb_density_profile (
          document_id, position, max_top, max_bot, min_value, mean_value, min_mean_ratio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          documentId,
          pos,
          densityProfileData[`max_top_${pos}`] || null,
          densityProfileData[`max_bot_${pos}`] || null,
          min || null,
          mean || null,
          minMeanRatio || null
        ]
      );
    }

    // 7️⃣ Simpan MC Board
    for (const pos of positions) {
      const w1 = mcBoardData[`w1_${pos}`];
      const w2 = mcBoardData[`w2_${pos}`];
      const mc = w1 && w2 ? ((parseFloat(w1) - parseFloat(w2)) / parseFloat(w2) * 100) : null;

      await client.query(
        `INSERT INTO lab_pb_mc_board (
          document_id, position, w1, w2, mc_value, avg_w1, avg_w2, avg_mc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          documentId,
          pos,
          w1 || null,
          w2 || null,
          mc || null,
          mcBoardData.avg_w1 || null,
          mcBoardData.avg_w2 || null,
          mcBoardData.avg_mc || null
        ]
      );
    }

    // 8️⃣ Simpan Swelling 2h
    for (const pos of positions) {
      const t1 = swellingData[`t1_${pos}`];
      const t2 = swellingData[`t2_${pos}`];
      const ts = t1 && t2 ? ((parseFloat(t2) - parseFloat(t1)) / parseFloat(t1) * 100) : null;

      await client.query(
        `INSERT INTO lab_pb_swelling (
          document_id, position, t1, t2, ts_value, avg_t1, avg_t2, avg_ts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          documentId,
          pos,
          t1 || null,
          t2 || null,
          ts || null,
          swellingData.avg_t1 || null,
          swellingData.avg_t2 || null,
          swellingData.avg_ts || null
        ]
      );
    }

    // 9️⃣ Simpan Surface Soundness
    for (const pos of ['le', 'ri']) {
      await client.query(
        `INSERT INTO lab_pb_surface_soundness (
          document_id, position, t1_value, avg_surface
        ) VALUES ($1, $2, $3, $4)`,
        [
          documentId,
          pos,
          surfaceSoundnessData[`t1_${pos}_surface`] || null,
          surfaceSoundnessData.avg_surface || null
        ]
      );
    }

    // 🔟 Simpan Additional Tests (single row)
    await client.query(
      `INSERT INTO lab_pb_additional_tests (
        document_id, avg_tebal_flakes, avg_cons_hardener, geltime_sl, geltime_cl
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        documentId,
        tebalFlakesData.avg_tebal || null,
        consHardenerData.avg_cons || null,
        geltimeData.sl || null,
        geltimeData.cl || null
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: "Laporan Lab PB berhasil disimpan",
      documentId,
      boardNo: board_no,
      timestamp: docResult.rows[0].timestamp
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR SIMPAN LAB PB:", err);
    res.status(500).json({ 
      error: "Gagal menyimpan laporan Lab PB",
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    client.release();
  }
});

/* =========================
LIST DOKUMEN (dengan pagination & filter)
========================= */
app.get('/api/lab-pb-documents', async (req, res) => {
  try {
    const { page = 1, limit = 20, board_no = '', date_from, date_to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query dengan filter
    let query = `
      SELECT id, board_no, timestamp, shift_group, tested_by, 
             created_at, updated_at
      FROM lab_pb_documents
      WHERE ($1 = '' OR board_no ILIKE $1)
    `;
    const params = [`%${board_no}%`];
    let paramCount = 2;

    if (date_from) {
      query += ` AND timestamp >= $${paramCount}`;
      params.push(date_from);
      paramCount++;
    }
    if (date_to) {
      query += ` AND timestamp <= $${paramCount}`;
      params.push(date_to);
      paramCount++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Hitung total untuk pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM lab_pb_documents 
      WHERE ($1 = '' OR board_no ILIKE $1)
    `;
    let countParams = [`%${board_no}%`];
    paramCount = 2;

    if (date_from) {
      countQuery += ` AND timestamp >= $${paramCount}`;
      countParams.push(date_from);
      paramCount++;
    }
    if (date_to) {
      countQuery += ` AND timestamp <= $${paramCount}`;
      countParams.push(date_to);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      documents: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
      }
    });

  } catch (err) {
    console.error("❌ ERROR LIST DOKUMEN:", err);
    res.status(500).json({ error: "Gagal mengambil daftar dokumen" });
  }
});

/* =========================
DETAIL DOKUMEN (VIEW)
========================= */
app.get('/api/lab-pb/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil dokumen utama
    const docResult = await pool.query(
      `SELECT * FROM lab_pb_documents WHERE id = $1`,
      [id]
    );
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const doc = docResult.rows[0];

    // Ambil semua data terkait
    const [
      samples,
      ibTests,
      bsTests,
      screwTests,
      densityProfiles,
      mcBoards,
      swellings,
      surfaceTests,
      additionalTests
    ] = await Promise.all([
      pool.query('SELECT * FROM lab_pb_samples WHERE document_id = $1 ORDER BY sample_no', [id]),
      pool.query('SELECT * FROM lab_pb_internal_bonding WHERE document_id = $1 ORDER BY position', [id]),
      pool.query('SELECT * FROM lab_pb_bending_strength WHERE document_id = $1 ORDER BY position', [id]),
      pool.query('SELECT * FROM lab_pb_screw_test WHERE document_id = $1 ORDER BY position', [id]),
      pool.query('SELECT * FROM lab_pb_density_profile WHERE document_id = $1 ORDER BY position', [id]),
      pool.query('SELECT * FROM lab_pb_mc_board WHERE document_id = $1 ORDER BY position', [id]),
      pool.query('SELECT * FROM lab_pb_swelling WHERE document_id = $1 ORDER BY position', [id]),
      pool.query('SELECT * FROM lab_pb_surface_soundness WHERE document_id = $1 ORDER BY position', [id]),
      pool.query('SELECT * FROM lab_pb_additional_tests WHERE document_id = $1', [id])
    ]);

    // Format data sesuai struktur frontend
    const formattedData = {
      document: {
        id: doc.id,
        timestamp: doc.timestamp.toISOString().slice(0, 16),
        board_no: doc.board_no,
        set_weight: doc.set_weight,
        shift_group: doc.shift_group,
        tested_by: doc.tested_by,
        density_min: doc.density_min,
        density_max: doc.density_max,
        board_type: doc.board_type,
        glue_sl: doc.glue_sl,
        glue_cl: doc.glue_cl,
        thick_min: doc.thick_min,
        thick_max: doc.thick_max,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      },
      samples: samples.rows.map(s => ({
        no: s.sample_no,
        weight_gr: s.weight_gr || '',
        thickness_mm: s.thickness_mm || '',
        length_mm: s.length_mm || '',
        width_mm: s.width_mm || ''
      })),
      ibData: {
        ib_le: ibTests.rows.find(r => r.position === 'le')?.ib_value || '',
        ib_ml: ibTests.rows.find(r => r.position === 'ml')?.ib_value || '',
        ib_md: ibTests.rows.find(r => r.position === 'md')?.ib_value || '',
        ib_mr: ibTests.rows.find(r => r.position === 'mr')?.ib_value || '',
        ib_ri: ibTests.rows.find(r => r.position === 'ri')?.ib_value || '',
        density_le: ibTests.rows.find(r => r.position === 'le')?.density_value || '',
        density_ml: ibTests.rows.find(r => r.position === 'ml')?.density_value || '',
        density_md: ibTests.rows.find(r => r.position === 'md')?.density_value || '',
        density_mr: ibTests.rows.find(r => r.position === 'mr')?.density_value || '',
        density_ri: ibTests.rows.find(r => r.position === 'ri')?.density_value || '',
        ib_avg: ibTests.rows[0]?.avg_ib || null,
        density_avg: ibTests.rows[0]?.avg_density || null
      },
      bsData: {
        mor_le: bsTests.rows.find(r => r.position === 'le')?.mor_value || '',
        mor_ml: bsTests.rows.find(r => r.position === 'ml')?.mor_value || '',
        mor_md: bsTests.rows.find(r => r.position === 'md')?.mor_value || '',
        mor_mr: bsTests.rows.find(r => r.position === 'mr')?.mor_value || '',
        mor_ri: bsTests.rows.find(r => r.position === 'ri')?.mor_value || '',
        density_le: bsTests.rows.find(r => r.position === 'le')?.density_value || '',
        density_ml: bsTests.rows.find(r => r.position === 'ml')?.density_value || '',
        density_md: bsTests.rows.find(r => r.position === 'md')?.density_value || '',
        density_mr: bsTests.rows.find(r => r.position === 'mr')?.density_value || '',
        density_ri: bsTests.rows.find(r => r.position === 'ri')?.density_value || '',
        mor_avg: bsTests.rows[0]?.avg_mor || null,
        bs_density_avg: bsTests.rows[0]?.avg_density || null
      },
      screwData: {
        face_le: screwTests.rows.find(r => r.position === 'le')?.face_value || '',
        face_ml: screwTests.rows.find(r => r.position === 'ml')?.face_value || '',
        face_md: screwTests.rows.find(r => r.position === 'md')?.face_value || '',
        face_mr: screwTests.rows.find(r => r.position === 'mr')?.face_value || '',
        face_ri: screwTests.rows.find(r => r.position === 'ri')?.face_value || '',
        edge_le: screwTests.rows.find(r => r.position === 'le')?.edge_value || '',
        edge_ml: screwTests.rows.find(r => r.position === 'ml')?.edge_value || '',
        edge_md: screwTests.rows.find(r => r.position === 'md')?.edge_value || '',
        edge_mr: screwTests.rows.find(r => r.position === 'mr')?.edge_value || '',
        edge_ri: screwTests.rows.find(r => r.position === 'ri')?.edge_value || '',
        face_avg: screwTests.rows[0]?.avg_face || null,
        edge_avg: screwTests.rows[0]?.avg_edge || null
      },
      densityProfileData: {
        max_top_le: densityProfiles.rows.find(r => r.position === 'le')?.max_top || '',
        max_top_ml: densityProfiles.rows.find(r => r.position === 'ml')?.max_top || '',
        max_top_md: densityProfiles.rows.find(r => r.position === 'md')?.max_top || '',
        max_top_mr: densityProfiles.rows.find(r => r.position === 'mr')?.max_top || '',
        max_top_ri: densityProfiles.rows.find(r => r.position === 'ri')?.max_top || '',
        max_bot_le: densityProfiles.rows.find(r => r.position === 'le')?.max_bot || '',
        max_bot_ml: densityProfiles.rows.find(r => r.position === 'ml')?.max_bot || '',
        max_bot_md: densityProfiles.rows.find(r => r.position === 'md')?.max_bot || '',
        max_bot_mr: densityProfiles.rows.find(r => r.position === 'mr')?.max_bot || '',
        max_bot_ri: densityProfiles.rows.find(r => r.position === 'ri')?.max_bot || '',
        min_le: densityProfiles.rows.find(r => r.position === 'le')?.min_value || '',
        min_ml: densityProfiles.rows.find(r => r.position === 'ml')?.min_value || '',
        min_md: densityProfiles.rows.find(r => r.position === 'md')?.min_value || '',
        min_mr: densityProfiles.rows.find(r => r.position === 'mr')?.min_value || '',
        min_ri: densityProfiles.rows.find(r => r.position === 'ri')?.min_value || '',
        mean_le: densityProfiles.rows.find(r => r.position === 'le')?.mean_value || '',
        mean_ml: densityProfiles.rows.find(r => r.position === 'ml')?.mean_value || '',
        mean_md: densityProfiles.rows.find(r => r.position === 'md')?.mean_value || '',
        mean_mr: densityProfiles.rows.find(r => r.position === 'mr')?.mean_value || '',
        mean_ri: densityProfiles.rows.find(r => r.position === 'ri')?.mean_value || ''
      },
      mcBoardData: {
        w1_le: mcBoards.rows.find(r => r.position === 'le')?.w1 || '',
        w1_ml: mcBoards.rows.find(r => r.position === 'ml')?.w1 || '',
        w1_md: mcBoards.rows.find(r => r.position === 'md')?.w1 || '',
        w1_mr: mcBoards.rows.find(r => r.position === 'mr')?.w1 || '',
        w1_ri: mcBoards.rows.find(r => r.position === 'ri')?.w1 || '',
        w2_le: mcBoards.rows.find(r => r.position === 'le')?.w2 || '',
        w2_ml: mcBoards.rows.find(r => r.position === 'ml')?.w2 || '',
        w2_md: mcBoards.rows.find(r => r.position === 'md')?.w2 || '',
        w2_mr: mcBoards.rows.find(r => r.position === 'mr')?.w2 || '',
        w2_ri: mcBoards.rows.find(r => r.position === 'ri')?.w2 || '',
        avg_w1: mcBoards.rows[0]?.avg_w1 || null,
        avg_w2: mcBoards.rows[0]?.avg_w2 || null,
        avg_mc: mcBoards.rows[0]?.avg_mc || null
      },
      swellingData: {
        t1_le: swellings.rows.find(r => r.position === 'le')?.t1 || '',
        t1_ml: swellings.rows.find(r => r.position === 'ml')?.t1 || '',
        t1_md: swellings.rows.find(r => r.position === 'md')?.t1 || '',
        t1_mr: swellings.rows.find(r => r.position === 'mr')?.t1 || '',
        t1_ri: swellings.rows.find(r => r.position === 'ri')?.t1 || '',
        t2_le: swellings.rows.find(r => r.position === 'le')?.t2 || '',
        t2_ml: swellings.rows.find(r => r.position === 'ml')?.t2 || '',
        t2_md: swellings.rows.find(r => r.position === 'md')?.t2 || '',
        t2_mr: swellings.rows.find(r => r.position === 'mr')?.t2 || '',
        t2_ri: swellings.rows.find(r => r.position === 'ri')?.t2 || '',
        avg_t1: swellings.rows[0]?.avg_t1 || null,
        avg_t2: swellings.rows[0]?.avg_t2 || null,
        avg_ts: swellings.rows[0]?.avg_ts || null
      },
      surfaceSoundnessData: {
        t1_le_surface: surfaceTests.rows.find(r => r.position === 'le')?.t1_value || '',
        t1_ri_surface: surfaceTests.rows.find(r => r.position === 'ri')?.t1_value || '',
        avg_surface: surfaceTests.rows[0]?.avg_surface || null
      },
      tebalFlakesData: {
        avg_tebal: additionalTests.rows[0]?.avg_tebal_flakes || ''
      },
      consHardenerData: {
        avg_cons: additionalTests.rows[0]?.avg_cons_hardener || ''
      },
      geltimeData: {
        sl: additionalTests.rows[0]?.geltime_sl || '',
        cl: additionalTests.rows[0]?.geltime_cl || ''
      }
    };

    res.json(formattedData);

  } catch (err) {
    console.error("❌ ERROR DETAIL DOKUMEN:", err);
    res.status(500).json({ error: "Gagal mengambil detail dokumen" });
  }
});

/* =========================
UPDATE DOKUMEN (EDIT)
========================= */
app.put('/api/lab-pb/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const {
      timestamp, board_no, set_weight, shift_group, tested_by,
      density_min, density_max, board_type, glue_sl, glue_cl,
      thick_min, thick_max, samples = [],
      ibData = {}, bsData = {}, screwData = {}, densityProfileData = {},
      mcBoardData = {}, swellingData = {}, surfaceSoundnessData = {},
      tebalFlakesData = {}, consHardenerData = {}, geltimeData = {}
    } = req.body;

    if (!board_no || !tested_by) {
      return res.status(400).json({ error: "Board No dan Tested By wajib diisi" });
    }

    await client.query('BEGIN');

    // 1️⃣ Update dokumen utama
    await client.query(
      `UPDATE lab_pb_documents SET
        timestamp = $1, board_no = $2, set_weight = $3, shift_group = $4,
        tested_by = $5, density_min = $6, density_max = $7, board_type = $8,
        glue_sl = $9, glue_cl = $10, thick_min = $11, thick_max = $12,
        updated_at = NOW()
      WHERE id = $13`,
      [
        timestamp, board_no, set_weight || null, shift_group, tested_by,
        density_min || null, density_max || null, board_type || null,
        glue_sl || null, glue_cl || null, thick_min || null, thick_max || null,
        id
      ]
    );

    // 2️⃣ Hapus data lama terkait
    await Promise.all([
      client.query('DELETE FROM lab_pb_samples WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_internal_bonding WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_bending_strength WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_screw_test WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_density_profile WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_mc_board WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_swelling WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_surface_soundness WHERE document_id = $1', [id]),
      client.query('DELETE FROM lab_pb_additional_tests WHERE document_id = $1', [id])
    ]);

    // 3️⃣ Insert ulang semua data (sama seperti POST)
    // Simpan samples
    for (const sample of samples) {
      await client.query(
        `INSERT INTO lab_pb_samples (
          document_id, sample_no, weight_gr, thickness_mm, length_mm, width_mm
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          sample.no,
          sample.weight_gr || null,
          sample.thickness_mm || null,
          sample.length_mm || null,
          sample.width_mm || null
        ]
      );
    }

    // Simpan Internal Bonding
    const positions = ['le', 'ml', 'md', 'mr', 'ri'];
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_internal_bonding (
          document_id, position, ib_value, density_value, avg_ib, avg_density
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          pos,
          ibData[`ib_${pos}`] || null,
          ibData[`density_${pos}`] || null,
          ibData.ib_avg || null,
          ibData.density_avg || null
        ]
      );
    }

    // Simpan Bending Strength
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_bending_strength (
          document_id, position, mor_value, density_value, avg_mor, avg_density
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          pos,
          bsData[`mor_${pos}`] || null,
          bsData[`density_${pos}`] || null,
          bsData.mor_avg || null,
          bsData.bs_density_avg || null
        ]
      );
    }

    // Simpan Screw Test
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_screw_test (
          document_id, position, face_value, edge_value, avg_face, avg_edge
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          pos,
          screwData[`face_${pos}`] || null,
          screwData[`edge_${pos}`] || null,
          screwData.face_avg || null,
          screwData.edge_avg || null
        ]
      );
    }

    // Simpan Density Profile
    for (const pos of positions) {
      const min = densityProfileData[`min_${pos}`];
      const mean = densityProfileData[`mean_${pos}`];
      const minMeanRatio = min && mean ? (parseFloat(min) / parseFloat(mean) * 100) : null;

      await client.query(
        `INSERT INTO lab_pb_density_profile (
          document_id, position, max_top, max_bot, min_value, mean_value, min_mean_ratio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          pos,
          densityProfileData[`max_top_${pos}`] || null,
          densityProfileData[`max_bot_${pos}`] || null,
          min || null,
          mean || null,
          minMeanRatio || null
        ]
      );
    }

    // Simpan MC Board
    for (const pos of positions) {
      const w1 = mcBoardData[`w1_${pos}`];
      const w2 = mcBoardData[`w2_${pos}`];
      const mc = w1 && w2 ? ((parseFloat(w1) - parseFloat(w2)) / parseFloat(w2) * 100) : null;

      await client.query(
        `INSERT INTO lab_pb_mc_board (
          document_id, position, w1, w2, mc_value, avg_w1, avg_w2, avg_mc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          pos,
          w1 || null,
          w2 || null,
          mc || null,
          mcBoardData.avg_w1 || null,
          mcBoardData.avg_w2 || null,
          mcBoardData.avg_mc || null
        ]
      );
    }

    // Simpan Swelling 2h
    for (const pos of positions) {
      const t1 = swellingData[`t1_${pos}`];
      const t2 = swellingData[`t2_${pos}`];
      const ts = t1 && t2 ? ((parseFloat(t2) - parseFloat(t1)) / parseFloat(t1) * 100) : null;

      await client.query(
        `INSERT INTO lab_pb_swelling (
          document_id, position, t1, t2, ts_value, avg_t1, avg_t2, avg_ts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          pos,
          t1 || null,
          t2 || null,
          ts || null,
          swellingData.avg_t1 || null,
          swellingData.avg_t2 || null,
          swellingData.avg_ts || null
        ]
      );
    }

    // Simpan Surface Soundness
    for (const pos of ['le', 'ri']) {
      await client.query(
        `INSERT INTO lab_pb_surface_soundness (
          document_id, position, t1_value, avg_surface
        ) VALUES ($1, $2, $3, $4)`,
        [
          id,
          pos,
          surfaceSoundnessData[`t1_${pos}_surface`] || null,
          surfaceSoundnessData.avg_surface || null
        ]
      );
    }

    // Simpan Additional Tests
    await client.query(
      `INSERT INTO lab_pb_additional_tests (
        document_id, avg_tebal_flakes, avg_cons_hardener, geltime_sl, geltime_cl
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        tebalFlakesData.avg_tebal || null,
        consHardenerData.avg_cons || null,
        geltimeData.sl || null,
        geltimeData.cl || null
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: "Laporan Lab PB berhasil diperbarui",
      documentId: id,
      boardNo: board_no
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR UPDATE LAB PB:", err);
    res.status(500).json({ 
      error: "Gagal memperbarui laporan Lab PB",
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    client.release();
  }
});

/* =========================
HAPUS DOKUMEN
========================= */
app.delete('/api/lab-pb-documents/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Hapus dokumen (CASCADE akan otomatis hapus semua child tables)
    const result = await client.query(
      `DELETE FROM lab_pb_documents WHERE id = $1 RETURNING id, board_no`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    await client.query('COMMIT');

    res.json({
      message: `Dokumen Lab PB #${result.rows[0].board_no} berhasil dihapus`,
      documentId: result.rows[0].id
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR HAPUS DOKUMEN:", err);
    res.status(500).json({ error: "Gagal menghapus dokumen" });
  } finally {
    client.release();
  }
});

/* =========================
HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lab PB API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/lab-pb-form-documents', async (req, res) => {
  const result = await pool.query(`
    SELECT 
      id,
      board_no AS title,
      created_at
    FROM lab_pb_documents
    ORDER BY created_at DESC
  `);

  res.json(result.rows);
});


// /* =========================
// ERROR HANDLING MIDDLEWARE
// ========================= */
// app.use((req, res) => {
//   res.status(404).json({ 
//     error: 'Endpoint tidak ditemukan',
//     path: req.originalUrl
//   });
// });

// app.use((err, req, res, next) => {
//   console.error('❌ UNHANDLED ERROR:', err);
//   res.status(500).json({ 
//     error: 'Terjadi kesalahan internal server',
//     detail: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan server' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});