import express from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet'; 
import rateLimit from 'express-rate-limit'; 

dotenv.config();

// Validasi environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in .env file');
  process.exit(1);
}

const app = express();

// Update CORS untuk akses jaringan lokal
// app.use(cors({
//   origin: function(origin, callback) {
//     // Izinkan akses tanpa origin (direct browser access) dan dari jaringan lokal
//     if (!origin || origin.startsWith('http://192.168.') || origin.startsWith('http://localhost')) {
//       return callback(null, true);
//     }
//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true
// }));

// // Untuk deploy dari vercel
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://canang-indah-dashboard.vercel.app"
  ],
  credentials: true
}));

app.use(helmet());

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



const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   
  max: 100,
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.'
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 10000,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
  message: 'Terlalu banyak percobaan login.'
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

// Helper function untuk validasi password 
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password minimal 6 karakter');
  }
  

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
    
    // Validasi username format
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
    
    //  pilih role
    if (!['admin', 'supervisor'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }
    
    // Cek username jika sudah ada
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
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    
    const user = result.rows[0];
    
    // Verifikasi password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
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

// Route dashboard
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.username} (${req.user.role})`,
    user: req.user
  });
});




/* =========================
   SIMPAN QC ANALISA (POST)
========================= */
app.post("/api/qc-analisa", async (req, res) => {
  const client = await pool.connect();

  try {
    const { tag_name, tanggal, shift_group, rows } = req.body;

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

    // INSERT dokumen dengan tag_name
    const docResult = await client.query(
      `INSERT INTO qc_analisa_documents 
       (title, tag_name, tanggal, shift_group, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [
        `QC Analisa ${tanggal} ${shift_group}`,
        tag_name || null,
        tanggal,
        shift_group
      ]
    );

    const documentId = docResult.rows[0].id;

    // Insert detail rows
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
      count: validRows.length
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR SIMPAN QC:", err);
    res.status(500).json({ error: "Gagal simpan QC Analisa: " + err.message });
  } finally {
    client.release();
  }
});

/* =========================
   LIST DOKUMEN (GET ALL) - ⚠️ PALING PENTING!
========================= */
app.get("/api/qc-analisa-documents", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         id, 
         title, 
         tag_name,
         tanggal,
         shift_group,
         created_at
       FROM qc_analisa_documents
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch QC docs error:", err);
    res.status(500).json({ error: "Gagal mengambil data: " + err.message });
  }
});

/* =========================
   DETAIL DOKUMEN (GET BY ID)
========================= */
app.get("/api/qc-analisa/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await pool.query(
      `SELECT id, title, tag_name, tanggal, shift_group, created_at 
       FROM qc_analisa_documents WHERE id=$1`,
      [id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const rows = await pool.query(
      "SELECT * FROM qc_analisa_screen WHERE document_id=$1 ORDER BY id",
      [id]
    );

    res.json({
      document: doc.rows[0],
      rows: rows.rows
    });
  } catch (err) {
    console.error("Fetch QC detail error:", err);
    res.status(500).json({ error: "Gagal memuat dokumen: " + err.message });
  }
});

/* =========================
   UPDATE QC ANALISA (PUT)
========================= */
app.put("/api/qc-analisa/:id", async (req, res) => {
  const { id } = req.params;
  const { tag_name, tanggal, shift_group, rows } = req.body;
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

    // UPDATE dokumen dengan tag_name
    await client.query(
      `UPDATE qc_analisa_documents 
       SET title = $1, tag_name = $2, tanggal = $3, shift_group = $4, updated_at = NOW()
       WHERE id = $5`,
      [
        `QC Analisa ${tanggal} ${shift_group}`,
        tag_name || null,
        tanggal,
        shift_group,
        id
      ]
    );

    // Hapus data lama di child table
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
    console.error("ERROR UPDATE QC:", err);
    res.status(500).json({ error: "Gagal memperbarui QC Analisa: " + err.message });
  } finally {
    client.release();
  }
});

/* =========================
   HAPUS DOKUMEN (DELETE) - ⚠️ FIX: pakai client.query di dalam transaction!
========================= */
app.delete("/api/qc-analisa-documents/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();  // 👈 Pakai client untuk transaction

  try {
    await client.query("BEGIN");

    // Hapus child records dulu (foreign key constraint) - 👈 PAKAI client.query!
    await client.query(
      "DELETE FROM qc_analisa_screen WHERE document_id = $1",
      [id]
    );

    // Hapus dokumen utama - 👈 PAKAI client.query!
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
    console.error("ERROR HAPUS QC:", err);
    res.status(500).json({ error: "Gagal menghapus dokumen: " + err.message });
  } finally {
    client.release();  // 👈 Release client, bukan pool
  }
});





/* ================= RESIN INSPECTION BACKEND ================= */

// ✅ POST: Simpan data baru (sudah include tag_name)
app.post("/api/resin-inspection", async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      tag_name,    // 👈 Tambahkan destructuring
      date, shift, group, 
      inspection, solidContent, 
      comment_by, createdBy 
    } = req.body;

    await client.query("BEGIN");

    // 👇 INSERT dengan tag_name
    const doc = await client.query(
      `INSERT INTO resin_inspection_documents
       (title, tag_name, date, shift, group_name, comment_by, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [
        `Resin Inspection ${date} ${shift}`, 
        tag_name || null,
        date, shift, group, comment_by, createdBy
      ]
    );

    const documentId = doc.rows[0].id;

    // Insert inspection rows
    for (const [i, row] of inspection.entries()) {
      await client.query(
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
    }

    // Insert solidContent rows
    for (const sample of solidContent || []) {
      for (const [idx, row] of (sample.rows || []).entries()) {
        await client.query(
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
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Resin Inspection tersimpan", documentId });
    
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Resin save error:", e);
    res.status(500).json({ error: "Gagal simpan: " + e.message });
  } finally {
    client.release();
  }
});

// ✅ GET ALL: Ambil semua dokumen untuk DocumentList (HANYA SATU ENDPOINT!)
app.get("/api/resin-inspection-documents", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         id, 
         title, 
         tag_name,              -- 👈 WAJIB: kirim tag_name
         date, 
         shift,                 -- 👈 WAJIB: kirim shift
         group_name,            -- 👈 WAJIB: kirim group_name
         comment_by, 
         created_by, 
         created_at
       FROM resin_inspection_documents
       ORDER BY created_at DESC`
    );

    const documents = result.rows;
    
    // Optional: ambil inspection pertama untuk ditampilkan di list
    for (const doc of documents) {
      const insp = await pool.query(
        `SELECT resin_tank, cert_test_no, quantity 
         FROM resin_inspection_inspection 
         WHERE document_id = $1 LIMIT 1`,
        [doc.id]
      );
      if (insp.rows[0]) {
        doc.inspection = [{
          resinTank: insp.rows[0].resin_tank,
          certTestNo: insp.rows[0].cert_test_no,
          quantity: insp.rows[0].quantity
        }];
      }
    }

    res.json(documents);
  } catch (err) {
    console.error("Fetch resin docs error:", err);
    res.status(500).json({ error: "Gagal mengambil data: " + err.message });
  }
});

// ✅ GET BY ID: Ambil detail dokumen untuk View/Edit
app.get("/api/resin-inspection/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await pool.query(
      `SELECT id, title, tag_name, date, shift, group_name, comment_by, created_by, created_at 
       FROM resin_inspection_documents WHERE id=$1`, 
      [id]
    );
    
    if (doc.rows.length === 0) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const [inspection, solids] = await Promise.all([
      pool.query(
        `SELECT * FROM resin_inspection_inspection WHERE document_id=$1 ORDER BY load_no`, 
        [id]
      ),
      pool.query(
        `SELECT * FROM resin_inspection_solids WHERE document_id=$1 ORDER BY sample_time, row_no`, 
        [id]
      )
    ]);

    res.json({
      document: doc.rows[0],  // 👈 Sudah include tag_name
      inspection: inspection.rows,
      solidContent: solids.rows
    });
  } catch (err) {
    console.error("Fetch resin detail error:", err);
    res.status(500).json({ error: "Gagal memuat dokumen" });
  }
});

// ✅ PUT: Update dokumen (sudah include tag_name)
app.put("/api/resin-inspection/:id", async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;
  const { 
    tag_name,    // 👈 Tambahkan destructuring
    date, shift, group, 
    inspection, solidContent, 
    comment_by, createdBy 
  } = req.body;

  try {
    await client.query("BEGIN");

    // 👇 UPDATE dengan tag_name
    await client.query(
      `UPDATE resin_inspection_documents
       SET title=$1, tag_name=$2, date=$3, shift=$4, group_name=$5,
           comment_by=$6, created_by=$7, updated_at=NOW()
       WHERE id=$8`,
      [
        `Resin Inspection ${date} ${shift}`, 
        tag_name || null,  // 👈 Update tag_name
        date, shift, group, comment_by, createdBy, id
      ]
    );

    // Delete old child records
    await client.query(`DELETE FROM resin_inspection_inspection WHERE document_id=$1`, [id]);
    await client.query(`DELETE FROM resin_inspection_solids WHERE document_id=$1`, [id]);

    // Insert new inspection rows
    for (const [i, row] of inspection.entries()) {
      await client.query(
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
    }

    // Insert new solidContent rows
    for (const sample of solidContent || []) {
      for (const [idx, row] of (sample.rows || []).entries()) {
        await client.query(
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
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Update berhasil" });
    
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Resin update error:", e);
    res.status(500).json({ error: "Gagal update: " + e.message });
  } finally {
    client.release();
  }
});

// ✅ DELETE: Hapus dokumen
app.delete("/api/resin-inspection-documents/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();  // 👈 Pakai client untuk transaction

  try {
    await client.query("BEGIN");

    // 👇 HAPUS SEMUA CHILD TABLES (urutannya penting!)
    
    // 1. Hapus dari resin_inspection_inspection
    await client.query(
      "DELETE FROM resin_inspection_inspection WHERE document_id = $1",
      [id]
    );

    // 2. Hapus dari resin_inspection_solids ⚠️ JANGAN LUPA INI!
    await client.query(
      "DELETE FROM resin_inspection_solids WHERE document_id = $1",
      [id]
    );

    // 3. Baru hapus dokumen utama
    const result = await client.query(
      "DELETE FROM resin_inspection_documents WHERE id = $1 RETURNING id",
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
    
    // 👇 LOG ERROR DETAIL KE TERMINAL (PENTING!)
    console.error("💥 DELETE RESIN ERROR:", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      table: err.table,
      constraint: err.constraint
    });
    
    res.status(500).json({ 
      error: "Gagal menghapus dokumen: " + err.message,
      code: err.code  // 👈 Kirim error code ke frontend untuk debug
    });
  } finally {
    client.release();  // 👈 Release client, bukan pool
  }
});




/* =========================
   FLAKES DOCUMENTS API - FIXED VERSION
========================= */

// ✅ CREATE Flakes Document Baru (dengan tag_name)
app.post("/api/flakes-documents", async (req, res) => {
  const client = await pool.connect();
  try {
    // 👇 Tambahkan destructuring tag_name
    const { tag_name, header, detail, total_jumlah, grand_total_ketebalan, rata_rata } = req.body;

    // Validasi input
    if (!header || !detail || detail.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    if (!header.tanggal) {
      return res.status(400).json({ error: "Tanggal harus diisi" });
    }

    await client.query("BEGIN");

    try {
      // 👇 INSERT dengan tag_name
      const docResult = await client.query(
        `INSERT INTO flakes_documents 
         (title, tag_name, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        [
          `Flakes ${header.tanggal}`,
          tag_name || null  // 👈 Simpan tag_name
        ]
      );

      const documentId = docResult.rows[0].id;

      // Insert header
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

      // Insert detail rows
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

      // Insert summary
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
      error: "Gagal menyimpan Flakes document: " + err.message,
      code: err.code,
      detail: err.detail
    });
  } finally {
    client.release();
  }
});

// ✅ READ Flakes documents LIST (dengan tag_name)
app.get("/api/flakes-documents", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fd.id, 
        fd.title, 
        fd.tag_name,          -- 👈 WAJIB: tambahkan tag_name
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
      tag_name: doc.tag_name,  // 👈 Return tag_name ke frontend
      created_at: doc.created_at,
      tanggal: doc.tanggal,
      shift: doc.shift,
      group: doc.group,
      type: "flakes"
    }));

    res.json(documents);
  } catch (err) {
    console.error("❌ ERROR GET FLAKES LIST:", err);
    res.status(500).json({ error: "Gagal memuat daftar Flakes: " + err.message });
  }
});

// ✅ READ Flakes document DETAIL (dengan tag_name)
app.get("/api/flakes-documents/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 👇 SELECT dengan tag_name
    const docResult = await pool.query(
      `SELECT fd.id, fd.title, fd.tag_name, fd.created_at, fd.updated_at, fh.*
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
      tag_name: doc.tag_name,  // 👈 Return tag_name ke frontend
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
    res.status(500).json({ error: "Gagal memuat detail Flakes: " + err.message });
  }
});

// ✅ UPDATE Flakes document (dengan tag_name)
app.put("/api/flakes-documents/:id", async (req, res) => {
  const { id } = req.params;
  const { tag_name, header, detail, total_jumlah, grand_total_ketebalan, rata_rata } = req.body;

  const client = await pool.connect();

  try {
    if (!header || !detail || detail.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    await client.query("BEGIN");

    /* ===== UPDATE DOCUMENT ===== */
    await client.query(
      `UPDATE flakes_documents SET
        title = $1,
        tag_name = $2,
        updated_at = NOW()
       WHERE id = $3`,
      [
        `Flakes ${header.tanggal}`,
        tag_name || null,
        Number(id)
      ]
    );

    /* ===== UPDATE HEADER ===== */
    await client.query(
      `UPDATE flakes_header SET
        tanggal = $1,
        jam = $2,
        shift = $3,
        ukuran_papan = $4,
        "group" = $5,
        jarak_pisau = $6,
        keterangan = $7,
        pemeriksa = $8,
        updated_at = NOW()
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
        Number(id)
      ]
    );

    /* ===== REFRESH DETAIL ===== */
    await client.query(
      `DELETE FROM flakes_detail WHERE document_id = $1`,
      [Number(id)]
    );

    for (const row of detail) {
      const tebal = Number(row.tebal) || 0;
      const jumlah = Number(row.jumlah) || 0;

      await client.query(
        `INSERT INTO flakes_detail 
         (document_id, tebal, jumlah, total_ketebalan, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          Number(id),
          tebal,
          jumlah,
          tebal * jumlah
        ]
      );
    }

    /* ===== UPSERT SUMMARY ===== */
    const summaryCheck = await client.query(
      `SELECT id FROM flakes_summary WHERE document_id = $1`,
      [Number(id)]
    );

    if (summaryCheck.rows.length > 0) {
      await client.query(
        `UPDATE flakes_summary SET
          total_jumlah = $1,
          grand_total_ketebalan = $2,
          rata_rata_ketebalan = $3,
          updated_at = NOW()
         WHERE document_id = $4`,
        [
          Number(total_jumlah) || 0,
          Number(grand_total_ketebalan) || 0,
          Number(rata_rata) || 0,
          Number(id)
        ]
      );
    } else {
      await client.query(
        `INSERT INTO flakes_summary
         (document_id, total_jumlah, grand_total_ketebalan, rata_rata_ketebalan, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          Number(id),
          Number(total_jumlah) || 0,
          Number(grand_total_ketebalan) || 0,
          Number(rata_rata) || 0
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Flakes document berhasil diperbarui",
      success: true
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("❌ ERROR UPDATE FLAKES:", err);

    res.status(500).json({
      error: "Gagal memperbarui Flakes document: " + err.message,
      code: err.code,
      detail: err.detail
    });
  } finally {
    client.release();
  }
});


// ✅ DELETE Flakes document (sudah benar, tetap sama)
app.delete("/api/flakes-documents/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM flakes_summary WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM flakes_detail WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM flakes_header WHERE document_id = $1`, [id]);

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
    res.status(500).json({ error: "Gagal menghapus Flakes document: " + err.message });
  } finally {
    client.release();
  }
});




/* =========================
   SIMPAN LAPORAN LAB PB BARU (POST)
========================= */
app.post('/api/lab-pb', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      tag_name,
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

    const docResult = await client.query(
      `INSERT INTO lab_pb_documents (
        tag_name, timestamp, board_no, set_weight, shift_group, tested_by,
        density_min, density_max, board_type, glue_sl, glue_cl,
        thick_min, thick_max, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
      RETURNING id, board_no, timestamp, tag_name`,
      [
        tag_name || null,
        timestamp,
        board_no,
        set_weight || null,
        shift_group,
        tested_by,
        density_min || null,
        density_max || null,
        board_type || null,
        glue_sl || null,
        glue_cl || null,
        thick_min || null,
        thick_max || null
      ]
    );

    const documentId = docResult.rows[0].id;

    for (const sample of samples) {
      await client.query(
        `INSERT INTO lab_pb_samples
        (document_id, sample_no, weight_gr, thickness_mm, length_mm, width_mm)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    const positions = ['le', 'ml', 'md', 'mr', 'ri'];

    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_internal_bonding
        (document_id, position, ib_value, density_value, avg_ib, avg_density)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_bending_strength
        (document_id, position, mor_value, density_value, avg_mor, avg_density)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_screw_test
        (document_id, position, face_value, edge_value, avg_face, avg_edge)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    await client.query(
      `INSERT INTO lab_pb_additional_tests
      (document_id, avg_tebal_flakes, avg_cons_hardener, geltime_sl, geltime_cl)
      VALUES ($1,$2,$3,$4,$5)`,
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
      tagName: docResult.rows[0].tag_name
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR SIMPAN LAB PB:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================
   LIST DOKUMEN LAB PB (GET) - FIXED (tanpa title)
========================= */
app.get('/api/lab-pb-documents', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, tag_name, board_no, shift_group, tested_by,
             created_at, updated_at, timestamp
      FROM lab_pb_documents
      ORDER BY created_at DESC
    `);

    const documents = result.rows.map(doc => ({
      id: doc.id,
      tag_name: doc.tag_name,
      board_no: doc.board_no,
      shift_group: doc.shift_group,
      tested_by: doc.tested_by,
      timestamp: doc.timestamp,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      type: "labPBForm"
    }));

    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   DETAIL DOKUMEN (GET BY ID) - FIXED (tanpa title)
========================= */
app.get('/api/lab-pb/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 👇 HAPUS title dari SELECT (karena kolom tidak ada!)
    const docResult = await pool.query(
      `SELECT id, tag_name, timestamp, board_no, set_weight, shift_group, tested_by,
              density_min, density_max, board_type, glue_sl, glue_cl, thick_min, thick_max,
              created_at, updated_at, status, submitted_at 
       FROM lab_pb_documents WHERE id = $1`,
      [id]
    );
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const doc = docResult.rows[0];

    // Ambil semua data child tables
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
      id: doc.id,
      tag_name: doc.tag_name,  // 👈 Return tag_name di ROOT level (penting untuk hook!)
      document: {
        id: doc.id,
        title: `Lab PB ${doc.board_no}`,  // 👈 Generate title di frontend (bukan dari DB)
        tag_name: doc.tag_name,
        timestamp: doc.timestamp?.toISOString?.()?.slice(0, 16) || doc.timestamp,
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
        updated_at: doc.updated_at,
        status: doc.status,
        submitted_at: doc.submitted_at
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
    res.status(500).json({ error: "Gagal mengambil detail dokumen: " + err.message });
  }
});

/* =========================
   UPDATE DOKUMEN LAB PB (PUT) - FIXED (tanpa title)
========================= */
app.put('/api/lab-pb/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const {
      tag_name,  // 👈 Ambil tag_name dari body
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

    // 👇 HAPUS title dari UPDATE (karena kolom tidak ada!)
    // UPDATE hanya kolom yang benar-benar ada di tabel
    await client.query(
      `UPDATE lab_pb_documents SET
        tag_name = $1,
        timestamp = $2,
        board_no = $3,
        set_weight = $4,
        shift_group = $5,
        tested_by = $6,
        density_min = $7,
        density_max = $8,
        board_type = $9,
        glue_sl = $10,
        glue_cl = $11,
        thick_min = $12,
        thick_max = $13,
        updated_at = NOW()
      WHERE id = $14`,
      [
        tag_name || null,
        timestamp,
        board_no,
        set_weight || null,
        shift_group,
        tested_by,
        density_min || null,
        density_max || null,
        board_type || null,
        glue_sl || null,
        glue_cl || null,
        thick_min || null,
        thick_max || null,
        id
      ]
    );

    // Hapus data lama dari child tables
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

    // Simpan samples (baru)
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

    // Simpan Internal Bonding (baru)
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

    // Simpan Bending Strength (baru)
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

    // Simpan Screw Test (baru)
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

    // Simpan Density Profile (baru)
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

    // Simpan MC Board (baru)
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

    // Simpan Swelling 2h (baru)
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

    // Simpan Surface Soundness (baru)
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

    // Simpan Additional Tests (baru)
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
      boardNo: board_no,
      tagName: tag_name  // 👈 Return tag_name ke frontend
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR UPDATE LAB PB:", err);
    res.status(500).json({ 
      error: "Gagal memperbarui laporan Lab PB: " + err.message,
      code: err.code
    });
  } finally {
    client.release();
  }
});

/* =========================
   HAPUS DOKUMEN (DELETE)
========================= */
app.delete('/api/lab-pb-documents/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 👇 Hapus child tables dulu (foreign key constraint)
    await client.query('DELETE FROM lab_pb_samples WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_internal_bonding WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_bending_strength WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_screw_test WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_density_profile WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_mc_board WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_swelling WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_surface_soundness WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_additional_tests WHERE document_id = $1', [id]);

    // Baru hapus dokumen utama
    const result = await client.query(
      `DELETE FROM lab_pb_documents WHERE id = $1 RETURNING id, board_no, tag_name`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    await client.query('COMMIT');

    res.json({
      message: `Dokumen Lab PB #${result.rows[0].board_no} berhasil dihapus`,
      documentId: result.rows[0].id,
      tagName: result.rows[0].tag_name
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR HAPUS DOKUMEN:", err);
    res.status(500).json({ error: "Gagal menghapus dokumen: " + err.message });
  } finally {
    client.release();
  }
});

/* =========================
   LEGACY ENDPOINT: /api/lab-pb-form-documents (alias untuk compatibility)
========================= */
app.get('/api/lab-pb-form-documents', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        tag_name,              -- 👈 Tambahkan tag_name
        board_no,
        shift_group,
        tested_by,
        created_at,
        updated_at
      FROM lab_pb_documents
      ORDER BY created_at DESC
    `);

    // Format response konsisten dengan endpoint utama
    const documents = result.rows.map(doc => ({
      id: doc.id,
      title: doc.title || `Lab PB ${doc.board_no}`,
      tag_name: doc.tag_name,  // 👈 Return tag_name
      board_no: doc.board_no,
      shift_group: doc.shift_group,
      tested_by: doc.tested_by,
      created_at: doc.created_at,
      type: "labPBForm"
    }));

    res.json(documents);
  } catch (err) {
    console.error("❌ ERROR LEGACY ENDPOINT:", err);
    res.status(500).json({ error: "Gagal mengambil data: " + err.message });
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

//akses jaringan lokal
const PORT = process.env.PORT || 3001;
// const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});