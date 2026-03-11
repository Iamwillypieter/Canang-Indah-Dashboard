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
app.set("trust proxy", 1);

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
// const pool = new Pool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "postgres",
//   password: process.env.DB_PASSWORD || "12345",
//   database: process.env.DB_NAME || "canang_indah",
//   port: process.env.DB_PORT || 5432,
// });

// untuk railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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


// ===============================
// 🔥 TEMPORARY DB FIX ROUTE (PRO VERSION)
// ===============================
// app.get("/fix-db", async (req, res) => {
//   try {
//     console.log("⚙ Running DB migration for shift_group...");

//     // 1️⃣ Tambah kolom jika belum ada
//     await pool.query(`
//       ALTER TABLE users
//       ADD COLUMN IF NOT EXISTS shift_group VARCHAR(2);
//     `);

//     // 2️⃣ Pastikan nullable
//     await pool.query(`
//       ALTER TABLE users
//       ALTER COLUMN shift_group DROP NOT NULL;
//     `);

//     // 3️⃣ Tambah constraint hanya boleh 1A-3D
//     await pool.query(`
//       DO $$
//       BEGIN
//         IF NOT EXISTS (
//           SELECT 1 FROM pg_constraint
//           WHERE conname = 'users_shift_group_check'
//         ) THEN
//           ALTER TABLE users
//           ADD CONSTRAINT users_shift_group_check
//           CHECK (shift_group IN (
//             '1A','1B','1C','1D',
//             '2A','2B','2C','2D',
//             '3A','3B','3C','3D'
//           ) OR shift_group IS NULL);
//         END IF;
//       END
//       $$;
//     `);

//     res.json({
//       success: true,
//       message: "Database shift_group configured successfully ✅",
//     });

//   } catch (err) {
//     console.error("❌ DB FIX ERROR:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message
//     });
//   }
// });


// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware untuk verifikasi token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    // ✨ Validasi format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn("⚠️ Auth header invalid:", authHeader);
      return res.status(401).json({ error: 'Token tidak ditemukan. Gunakan format: Bearer <token>' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.warn("❌ JWT verify error:", err.name, err.message);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token telah kadaluarsa',
            code: 'TOKEN_EXPIRED'
          });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ 
            error: 'Token tidak valid',
            code: 'INVALID_TOKEN'
          });
        }
        return res.status(403).json({ error: 'Akses ditolak', code: 'AUTH_FAILED' });
      }
      
      // ✅ Debug info (hanya di development)
      if (process.env.NODE_ENV === 'development') {
        console.log("🔐 User authenticated:", { 
          id: user.id, 
          role: user.role,
          shift: user.shift,
          group: user.group 
        });
      }
      
      req.user = user;
      next();
    });
    
  } catch (error) {
    console.error("💥 Auth middleware crash:", error);
    return res.status(500).json({ error: 'Internal server error - autentikasi' });
  }
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
    const { username, password, confirmPassword, role, shift_group } = req.body;
    
    // Validasi input dasar
    if (!username || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    // Validasi username length
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username harus 3-50 karakter' });
    }

    // Validasi username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username hanya boleh huruf, angka, underscore' });
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

    // 🔥 VALIDASI SHIFT BARU
    const validShifts = [
      '1A','1B','1C','1D',
      '2A','2B','2C','2D',
      '3A','3B','3C','3D'
    ];

    let finalShift = null;

    if (role === 'admin') {
      if (!shift_group) {
        return res.status(400).json({
          error: 'Shift wajib dipilih untuk Admin'
        });
      }

      if (!validShifts.includes(shift_group)) {
        return res.status(400).json({
          error: 'Shift tidak valid'
        });
      }

      finalShift = shift_group;
    }

    if (role === 'supervisor') {
      finalShift = null;
    }

    // Cek username sudah ada
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, password, role, shift_group)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, shift_group`,
      [username, hashedPassword, role, finalShift]
    );

    console.log(`✅ New user registered: ${username} (${role}) Shift: ${finalShift}`);

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
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        shift_group: user.shift_group   // 🔥 tambahkan ini
      },
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
        role: user.role,
        shift_group: user.shift_group
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
app.post("/api/qc-analisa", authenticateToken, async (req, res) => {

  const client = await pool.connect();

  try {

    const { rows } = req.body;
    const user = req.user;

    // =========================================
    // GET SHIFT FROM USER
    // =========================================

    const shiftGroup = user.shift_group;

    if (!shiftGroup) {
      return res.status(400).json({
        error: "User shift_group tidak ditemukan"
      });
    }

    const shift = shiftGroup.charAt(0);
    const group = shiftGroup.charAt(1);

    // =========================================
    // VALIDASI ROWS
    // =========================================

    if (!rows || rows.length === 0) {
      return res.status(400).json({
        error: "Rows tidak boleh kosong"
      });
    }

    const validRows = rows.filter(row =>
      row.jam || row.material || row.jumlah_gr
    );

    if (validRows.length === 0) {
      return res.status(400).json({
        error: "Semua baris kosong"
      });
    }

    await client.query("BEGIN");

    // =========================================
    // GENERATE RUNNING NUMBER
    // =========================================

    const countResult = await client.query(
      `SELECT COUNT(*) 
       FROM qc_analisa_documents
       WHERE DATE(created_at) = CURRENT_DATE
       AND shift_group = $1`,
      [shiftGroup]
    );

    const runningNumber = String(
      parseInt(countResult.rows[0].count) + 1
    ).padStart(4, "0");


    // =========================================
    // DATE & TIME REALTIME
    // =========================================

    const now = new Date();

    const jakartaTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(now);

    const get = type => jakartaTime.find(x => x.type === type).value;

    const day = get("day");
    const month = get("month");
    const year = get("year");
    const hours = get("hour");
    const minutes = get("minute");

    const date = `${day}${month}${year}`;
    const time = `${hours}.${minutes}`;


    // =========================================
    // TAG NAME
    // =========================================

    const tag_name = `QC Analisa ${runningNumber} ${shift}${group} ${date} ${time}`;


    // =========================================
    // INSERT DOCUMENT
    // =========================================

    const docResult = await client.query(
      `INSERT INTO qc_analisa_documents
       (title, tag_name, tanggal, shift_group, created_at)
       VALUES ($1,$2,NOW(),$3,NOW())
       RETURNING id`,
      [
        "QC Analisa",
        tag_name,
        shiftGroup
      ]
    );

    const documentId = docResult.rows[0].id;


    // =========================================
    // INSERT ROWS
    // =========================================

    for (const row of validRows) {

      await client.query(
        `INSERT INTO qc_analisa_screen (
          document_id, tanggal, shift_group, jam, material,
          fraction_gt_8, fraction_gt_4, fraction_gt_3_15,
          fraction_gt_2, fraction_gt_1, fraction_0_5,
          fraction_0_25, fraction_lt_0_25,
          jumlah_gr, keterangan, diperiksa_oleh
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
        )`,
        [
          documentId,
          row.tanggal || null,
          shiftGroup,
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
      tag_name,
      documentId,
      rows: validRows.length
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("❌ ERROR SIMPAN QC ANALISA:", err);

    res.status(500).json({
      error: "Gagal simpan QC Analisa: " + err.message
    });

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
   UPDATE QC ANALISA
========================= */
app.put("/api/qc-analisa/:id", authenticateToken, async (req, res) => {

  const { id } = req.params
  const { tanggal, rows } = req.body

  const user = req.user
  const userShiftGroup = user.shift_group

  const client = await pool.connect()

  try {

    if (!tanggal || !rows || rows.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap" })
    }

    const validRows = rows.filter(row =>
      row.jam || row.material || row.jumlah_gr
    )

    if (validRows.length === 0) {
      return res.status(400).json({ error: "Semua baris kosong" })
    }

    await client.query("BEGIN")

    /* =========================
       CEK DOKUMEN
    ========================= */

    const docCheck = await client.query(
      `SELECT id, shift_group, tag_name
       FROM qc_analisa_documents
       WHERE id = $1`,
      [id]
    )

    if (docCheck.rowCount === 0) {

      await client.query("ROLLBACK")

      return res.status(404).json({
        error: "Dokumen tidak ditemukan"
      })

    }

    const document = docCheck.rows[0]

    /* =========================
       VALIDASI SHIFT
    ========================= */

    if (document.shift_group !== userShiftGroup) {

      await client.query("ROLLBACK")

      return res.status(403).json({
        error: `Shift ${userShiftGroup} tidak boleh mengedit dokumen ${document.tag_name}`
      })

    }

    /* =========================
       UPDATE DOCUMENT
    ========================= */

    await client.query(
      `UPDATE qc_analisa_documents
       SET title = $1,
           tanggal = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [
        `QC Analisa ${tanggal} ${userShiftGroup}`,
        tanggal,
        id
      ]
    )

    /* =========================
       DELETE CHILD DATA
    ========================= */

    await client.query(
      `DELETE FROM qc_analisa_screen
       WHERE document_id = $1`,
      [id]
    )

    /* =========================
       INSERT ROW BARU
    ========================= */

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
          tanggal,
          userShiftGroup,
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
          user.username
        ]
      )

    }

    await client.query("COMMIT")

    res.json({
      message: `Dokumen ${document.tag_name} berhasil diperbarui`,
      rows: validRows.length
    })

  } catch (err) {

    await client.query("ROLLBACK")

    console.error("UPDATE QC ERROR:", err)

    res.status(500).json({
      error: "Gagal update QC Analisa",
      detail: err.message
    })

  } finally {

    client.release()

  }

})

/* =========================
   DELETE QC ANALISA
========================= */
app.delete("/api/qc-analisa-documents/:id", authenticateToken, async (req, res) => {

  const { id } = req.params
  const user = req.user
  const userShiftGroup = user.shift_group

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /* =========================
       CEK DOKUMEN
    ========================= */

    const docCheck = await client.query(
      `SELECT id, shift_group, tag_name
       FROM qc_analisa_documents
       WHERE id = $1`,
      [id]
    )

    if (docCheck.rowCount === 0) {

      await client.query("ROLLBACK")

      return res.status(404).json({
        error: "Dokumen tidak ditemukan"
      })

    }

    const document = docCheck.rows[0]

    /* =========================
       VALIDASI SHIFT
    ========================= */

    if (document.shift_group !== userShiftGroup) {

      await client.query("ROLLBACK")

      return res.status(403).json({
        error: `Shift ${userShiftGroup} tidak boleh menghapus dokumen ${document.tag_name}`
      })

    }

    /* =========================
       DELETE CHILD
    ========================= */

    await client.query(
      `DELETE FROM qc_analisa_screen
       WHERE document_id = $1`,
      [id]
    )

    /* =========================
       DELETE DOCUMENT
    ========================= */

    await client.query(
      `DELETE FROM qc_analisa_documents
       WHERE id = $1`,
      [id]
    )

    await client.query("COMMIT")

    res.json({
      success: true,
      message: `Dokumen ${document.tag_name} berhasil dihapus`
    })

  } catch (error) {

    await client.query("ROLLBACK")

    console.error("DELETE QC ERROR:", error)

    res.status(500).json({
      success: false,
      message: "Gagal menghapus dokumen",
      error: error.message
    })

  } finally {

    client.release()

  }

})





/* ================= RESIN INSPECTION BACKEND ================= */

// ✅ POST: Simpan data baru (sudah include tag_name)
app.post("/api/resin-inspection", authenticateToken, async (req, res) => {

  const client = await pool.connect();

  try {

    const { inspection, solidContent, comment_by } = req.body;
    const user = req.user;

    const shiftGroup = user.shift_group;

    if (!shiftGroup) {
      return res.status(400).json({
        error: "User shift_group tidak ditemukan"
      });
    }

    const shift = shiftGroup.charAt(0);
    const group = shiftGroup.charAt(1);
    const createdBy = user.id;

    await client.query("BEGIN");

    // ========================================
    // TIMEZONE ASIA JAKARTA
    // ========================================

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const date = `${day}${month}${year}`;
    const time = `${hours}.${minutes}`;

    // ========================================
    // RUNNING NUMBER
    // ========================================

    const countResult = await client.query(
      `SELECT COUNT(*) 
       FROM resin_inspection_documents
       WHERE DATE(created_at AT TIME ZONE 'Asia/Jakarta') =
       DATE(NOW() AT TIME ZONE 'Asia/Jakarta')
       AND shift = $1
       AND group_name = $2`,
      [shift, group]
    );

    const runningNumber = String(
      parseInt(countResult.rows[0].count) + 1
    ).padStart(4, "0");

    // ========================================
    // TAG NAME
    // ========================================

    const tag_name = `Resin Inspection ${runningNumber} ${shift}${group} ${date} ${time}`;

    const title = "Resin Inspection";

    const doc = await client.query(
      `INSERT INTO resin_inspection_documents
       (title, tag_name, date, shift, group_name, comment_by, created_by, created_at)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6,NOW())
       RETURNING id`,
      [
        title,
        tag_name,
        shift,
        group,
        comment_by,
        createdBy
      ]
    );

    const documentId = doc.rows[0].id;

    // ========================================
    // INSERT INSPECTION
    // ========================================

    for (const [i, row] of inspection.entries()) {

      await client.query(
        `INSERT INTO resin_inspection_inspection
        (document_id, load_no, cert_test_no, resin_tank, quantity,
        specific_gravity, viscosity, ph, gel_time, water_tolerance, appearance, solids)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          documentId,
          i + 1,
          row.certTestNo,
          row.resinTank,
          row.quantity,
          row.specificGravity,
          row.viscosity,
          row.ph,
          row.gelTime,
          row.waterTolerance,
          row.appearance,
          row.solids
        ]
      );

    }

    // ========================================
    // INSERT SOLIDS
    // ========================================

    for (const sample of solidContent || []) {

      for (const [idx, row] of (sample.rows || []).entries()) {

        await client.query(
          `INSERT INTO resin_inspection_solids
           (document_id, sample_time, row_no, alum_foil_no,
            wt_alum_foil, wt_glue, wt_alum_foil_dry_glue,
            wt_dry_glue, solids_content, remark)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            documentId,
            sample.sampleTime,
            idx + 1,
            row.alumFoilNo,
            row.wtAlumFoil,
            row.wtGlue,
            row.wtAlumFoilDryGlue,
            row.wtDryGlue,
            row.solidsContent,
            row.remark
          ]
        );

      }

    }

    await client.query("COMMIT");

    res.json({
      message: "Resin Inspection tersimpan",
      tag_name,
      documentId
    });

  } catch (e) {

    await client.query("ROLLBACK");

    console.error("Resin save error:", e);

    res.status(500).json({
      error: "Gagal simpan: " + e.message
    });

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
app.put("/api/resin-inspection/:id", authenticateToken, async (req, res) => {

  const client = await pool.connect();
  const { id } = req.params;

  const {
    inspection,
    solidContent,
    comment_by
  } = req.body;

  const user = req.user;

  try {

    const shiftGroup = user.shift_group;

    if (!shiftGroup) {
      return res.status(400).json({
        error: "User shift_group tidak ditemukan"
      });
    }

    const userShift = shiftGroup.charAt(0);
    const userGroup = shiftGroup.charAt(1);

    await client.query("BEGIN");

    // =========================================
    // CEK DOKUMEN
    // =========================================

    const docCheck = await client.query(
      `SELECT id, shift, group_name, tag_name
       FROM resin_inspection_documents
       WHERE id = $1`,
      [id]
    );

    if (docCheck.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Dokumen tidak ditemukan"
      });

    }

    const document = docCheck.rows[0];

    // =========================================
    // VALIDASI SHIFT + GROUP
    // =========================================

    if (
      document.shift !== userShift ||
      document.group_name !== userGroup
    ) {

      await client.query("ROLLBACK");

      return res.status(403).json({
        error: `Shift ${userShift}${userGroup} tidak boleh mengedit dokumen ${document.tag_name}`
      });

    }

    // =========================================
    // UPDATE DOCUMENT
    // =========================================

    await client.query(
      `UPDATE resin_inspection_documents
       SET comment_by = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [
        comment_by,
        id
      ]
    );


    // =========================================
    // DELETE CHILD TABLES
    // =========================================

    await client.query(
      `DELETE FROM resin_inspection_inspection
       WHERE document_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM resin_inspection_solids
       WHERE document_id = $1`,
      [id]
    );


    // =========================================
    // INSERT INSPECTION ROWS
    // =========================================

    for (const [i, row] of inspection.entries()) {

      await client.query(
        `INSERT INTO resin_inspection_inspection
         (document_id, load_no, cert_test_no, resin_tank, quantity,
          specific_gravity, viscosity, ph, gel_time, water_tolerance, appearance, solids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          id,
          i + 1,
          row.certTestNo,
          row.resinTank,
          row.quantity,
          row.specificGravity,
          row.viscosity,
          row.ph,
          row.gelTime,
          row.waterTolerance,
          row.appearance,
          row.solids
        ]
      );

    }


    // =========================================
    // INSERT SOLIDS CONTENT
    // =========================================

    for (const sample of solidContent || []) {

      for (const [idx, row] of (sample.rows || []).entries()) {

        await client.query(
          `INSERT INTO resin_inspection_solids
           (document_id, sample_time, row_no, alum_foil_no,
            wt_alum_foil, wt_glue, wt_alum_foil_dry_glue,
            wt_dry_glue, solids_content, remark)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            id,
            sample.sampleTime,
            idx + 1,
            row.alumFoilNo,
            row.wtAlumFoil,
            row.wtGlue,
            row.wtAlumFoilDryGlue,
            row.wtDryGlue,
            row.solidsContent,
            row.remark
          ]
        );

      }

    }

    await client.query("COMMIT");

    res.json({
      message: `Dokumen ${document.tag_name} berhasil diperbarui`
    });

  } catch (e) {

    await client.query("ROLLBACK");

    console.error("Resin update error:", e);

    res.status(500).json({
      error: "Gagal update: " + e.message
    });

  } finally {

    client.release();

  }

});

// ✅ DELETE: Hapus dokumen
app.delete("/api/resin-inspection-documents/:id", authenticateToken, async (req, res) => {

  const { id } = req.params;
  const client = await pool.connect();

  try {

    const user = req.user;

    const shiftGroup = user.shift_group;

    if (!shiftGroup) {
      return res.status(400).json({
        error: "User shift_group tidak ditemukan"
      });
    }

    const userShift = shiftGroup.charAt(0);
    const userGroup = shiftGroup.charAt(1);

    await client.query("BEGIN");

    const docCheck = await client.query(
      `SELECT id, shift, group_name, tag_name
       FROM resin_inspection_documents
       WHERE id = $1`,
      [id]
    );

    if (docCheck.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Dokumen tidak ditemukan"
      });

    }

    const document = docCheck.rows[0];

    // VALIDASI SHIFT

    if (document.shift !== userShift || document.group_name !== userGroup) {

      await client.query("ROLLBACK");

      return res.status(403).json({
        error: `Shift ${userShift}${userGroup} tidak boleh menghapus dokumen ${document.tag_name}`
      });

    }

    await client.query(
      `DELETE FROM resin_inspection_inspection
       WHERE document_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM resin_inspection_solids
       WHERE document_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM resin_inspection_documents
       WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: `Dokumen ${document.tag_name} berhasil dihapus`
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("DELETE ERROR:", err);

    res.status(500).json({
      error: "Gagal menghapus dokumen: " + err.message
    });

  } finally {

    client.release();

  }

});




/* =========================
   FLAKES DOCUMENTS API - FIXED VERSION
========================= */

// ✅ CREATE Flakes Document Baru (dengan tag_name)
app.post("/api/flakes-documents", authenticateToken, async (req, res) => {

  const client = await pool.connect();

  try {

    const { header, detail, total_jumlah, grand_total_ketebalan, rata_rata } = req.body;

    if (!header || !detail || detail.length === 0) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    if (!header.tanggal) {
      return res.status(400).json({ error: "Tanggal harus diisi" });
    }

    await client.query("BEGIN");

    /* ==============================
       USER SHIFT & GROUP (FROM LOGIN)
    ============================== */

    const shiftGroup = req.user?.shift_group;

    if (!shiftGroup) {
      return res.status(403).json({
        error: "User tidak memiliki shift_group"
      });
    }

    const shift = shiftGroup.charAt(0);
    const group = shiftGroup.charAt(1);

    /* ==============================
       AUTO RUNNING NUMBER
    ============================== */

    const countResult = await client.query(
      `
      SELECT COUNT(*) 
      FROM flakes_header
      WHERE tanggal = $1
      AND shift = $2
      AND "group" = $3
      `,
      [header.tanggal, shift, group]
    );

    const runningNumber = String(
      Number(countResult.rows[0].count) + 1
    ).padStart(4, "0");

    /* ==============================
       FORMAT TANGGAL
    ============================== */

    const tanggalObj = new Date(header.tanggal);

    const dd = String(tanggalObj.getDate()).padStart(2, "0");
    const mm = String(tanggalObj.getMonth() + 1).padStart(2, "0");
    const yyyy = tanggalObj.getFullYear();

    const formattedDate = `${dd}${mm}${yyyy}`;

    /* ==============================
       JAM SERVER WIB
    ============================== */

    const now = new Date();

    const timeWIB = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    const hh = String(timeWIB.getHours()).padStart(2, "0");
    const min = String(timeWIB.getMinutes()).padStart(2, "0");
    const sec = String(timeWIB.getSeconds()).padStart(2, "0");

    const jamForTag = `${hh}.${min}`;
    const jamForDb = `${hh}:${min}:${sec}`;

    /* ==============================
       GENERATE TAG
    ============================== */

    const generatedTag = `FLAKES ${runningNumber} ${shiftGroup} ${formattedDate} ${jamForTag}`;

    /* ==============================
       INSERT DOCUMENT
    ============================== */

    const docResult = await client.query(
      `
      INSERT INTO flakes_documents 
      (title, tag_name, created_at, updated_at)
      VALUES ($1,$2,NOW(),NOW())
      RETURNING id
      `,
      [
        `Flakes ${header.tanggal}`,
        generatedTag
      ]
    );

    const documentId = docResult.rows[0].id;

    /* ==============================
       INSERT HEADER
    ============================== */

    await client.query(
      `
      INSERT INTO flakes_header (
        document_id,
        tanggal,
        jam,
        shift,
        ukuran_papan,
        "group",
        jarak_pisau,
        keterangan,
        pemeriksa,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      `,
      [
        documentId,
        header.tanggal,
        jamForDb,
        shift,
        header.ukuranPapan || null,
        group,
        header.jarakPisau || null,
        header.keterangan || null,
        header.pemeriksa || null
      ]
    );

    /* ==============================
       INSERT DETAIL
    ============================== */

    for (const row of detail) {

      const tebal = Number(row.tebal) || 0;
      const jumlah = Number(row.jumlah) || 0;

      await client.query(
        `
        INSERT INTO flakes_detail
        (document_id, tebal, jumlah, total_ketebalan, created_at)
        VALUES ($1,$2,$3,$4,NOW())
        `,
        [
          documentId,
          tebal,
          jumlah,
          tebal * jumlah
        ]
      );

    }

    /* ==============================
       INSERT SUMMARY
    ============================== */

    await client.query(
      `
      INSERT INTO flakes_summary (
        document_id,
        total_jumlah,
        grand_total_ketebalan,
        rata_rata_ketebalan,
        created_at
      )
      VALUES ($1,$2,$3,$4,NOW())
      `,
      [
        documentId,
        Number(total_jumlah) || 0,
        Number(grand_total_ketebalan) || 0,
        Number(rata_rata) || 0
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Flakes document berhasil disimpan",
      documentId,
      tag_name: generatedTag,
      success: true
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("❌ ERROR CREATE FLAKES:", err);

    res.status(500).json({
      error: "Gagal menyimpan Flakes document: " + err.message
    });

  } finally {

    client.release();

  }

});

// ✅ READ Flakes documents LIST (dengan tag_name)
app.get("/api/flakes-documents", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (fd.id)
        fd.id,
        fd.title,
        fd.tag_name,
        fd.created_at,
        fh.tanggal,
        fh.shift,
        fh."group"
      FROM flakes_documents fd
      LEFT JOIN flakes_header fh 
        ON fd.id = fh.document_id
      ORDER BY fd.id, fd.created_at DESC
    `);

    const documents = result.rows.map(doc => ({
      id: doc.id,
      title: doc.title || `Flakes ${
        doc.tanggal
          ? new Date(doc.tanggal).toLocaleDateString("id-ID")
          : "Baru"
      }`,
      tag_name: doc.tag_name || "-", // safety fallback
      created_at: doc.created_at,
      tanggal: doc.tanggal,
      shift: doc.shift,
      group: doc.group,
      type: "flakes"
    }));

    // Sort paling baru di atas (lebih aman di JS juga)
    documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(documents);

  } catch (err) {
    console.error("❌ ERROR GET FLAKES LIST:", err);
    res.status(500).json({
      error: "Gagal memuat daftar Flakes: " + err.message
    });
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

// ✅ UPDATE Flakes document
app.put("/api/flakes-documents/:id", authenticateToken, async (req, res) => {

  const rawId = req.params.id?.toString().trim();
  const id = parseInt(rawId, 10);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "ID dokumen tidak valid" });
  }

  const { header, detail, total_jumlah, grand_total_ketebalan, rata_rata } = req.body;

  const client = await pool.connect();

  try {

    if (!req.user?.id) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    if (!header || typeof header !== "object") {
      return res.status(400).json({
        error: "Data header tidak valid"
      });
    }

    if (!Array.isArray(detail) || detail.length === 0) {
      return res.status(400).json({
        error: "Data detail wajib diisi"
      });
    }

    await client.query("BEGIN");

    /* ==============================
       CEK DOKUMEN ADA ATAU TIDAK
    ============================== */

    const docCheck = await client.query(
      `SELECT document_id FROM flakes_header WHERE document_id = $1`,
      [id]
    );

    if (docCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Dokumen tidak ditemukan"
      });
    }

    /* ==============================
       UPDATE DOCUMENT
    ============================== */

    await client.query(
      `UPDATE flakes_documents
       SET title = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [`Flakes ${header.tanggal}`, id]
    );

    /* ==============================
       UPDATE HEADER
    ============================== */

    await client.query(
      `UPDATE flakes_header
       SET tanggal = $1,
           jam = $2,
           ukuran_papan = $3,
           jarak_pisau = $4,
           keterangan = $5,
           pemeriksa = $6,
           updated_at = NOW()
       WHERE document_id = $7`,
      [
        header.tanggal,
        header.jam || null,
        header.ukuranPapan || null,
        header.jarakPisau || null,
        header.keterangan || null,
        header.pemeriksa || null,
        id
      ]
    );

    /* ==============================
       HAPUS DETAIL LAMA
    ============================== */

    await client.query(
      `DELETE FROM flakes_detail WHERE document_id = $1`,
      [id]
    );

    /* ==============================
       INSERT DETAIL BARU
    ============================== */

    for (let i = 0; i < detail.length; i++) {

      const row = detail[i];

      const tebal = Number(row?.tebal);
      const jumlah = Number(row?.jumlah);

      if (isNaN(tebal) || isNaN(jumlah)) {
        throw new Error(`Detail row ${i + 1} tidak valid`);
      }

      await client.query(
        `INSERT INTO flakes_detail
         (document_id, tebal, jumlah, total_ketebalan, created_at)
         VALUES ($1,$2,$3,$4,NOW())`,
        [
          id,
          tebal,
          jumlah,
          tebal * jumlah
        ]
      );

    }

    /* ==============================
       HAPUS SUMMARY LAMA
    ============================== */

    await client.query(
      `DELETE FROM flakes_summary WHERE document_id = $1`,
      [id]
    );

    /* ==============================
       INSERT SUMMARY BARU
    ============================== */

    await client.query(
      `INSERT INTO flakes_summary
       (document_id, total_jumlah, grand_total_ketebalan, rata_rata_ketebalan, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [
        id,
        Number(total_jumlah) || 0,
        Number(grand_total_ketebalan) || 0,
        Number(rata_rata) || 0
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Flakes document berhasil diperbarui",
      documentId: id,
      updatedAt: new Date().toISOString()
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("❌ ERROR UPDATE FLAKES:", err);

    return res.status(500).json({
      error: "Gagal memperbarui Flakes document",
      message: err.message
    });

  } finally {

    client.release();

  }

});

// ✅ DELETE Flakes document (sudah benar, tetap sama)
app.delete("/api/flakes-documents/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await client.query("BEGIN");

    const docCheck = await client.query(
      `SELECT shift, "group"
       FROM flakes_header
       WHERE document_id = $1`,
      [Number(id)]
    );

    if (docCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const documentShift = docCheck.rows[0].shift;
    const documentGroup = docCheck.rows[0].group;

    const userShift = req.user.shift_group?.[0];
    const userGroup = req.user.shift_group?.[1];

    const docShift = String(documentShift).trim();
    const docGroup = String(documentGroup).trim();

    const usrShift = String(userShift).trim();
    const usrGroup = String(userGroup).trim();

    console.log("DOC:", docShift, docGroup);
    console.log("USER:", usrShift, usrGroup);
    console.log("DOC:", documentShift, documentGroup);
    console.log("USER:", userShift, userGroup);

    if (docShift !== usrShift || docGroup !== usrGroup) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Dokumen hanya bisa dihapus oleh shift yang membuatnya"
      });
    }

    await client.query(`DELETE FROM flakes_summary WHERE document_id = $1`, [Number(id)]);
    await client.query(`DELETE FROM flakes_detail WHERE document_id = $1`, [Number(id)]);
    await client.query(`DELETE FROM flakes_header WHERE document_id = $1`, [Number(id)]);

    await client.query(
      `DELETE FROM flakes_documents WHERE id = $1`,
      [Number(id)]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Flakes document berhasil dihapus"
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
   SIMPAN LAPORAN LAB PB BARU (POST)
========================= */
app.post('/api/lab-pb', authenticateToken, async (req, res) => {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    /* ================= USER DARI TOKEN ================= */

    const userId = req.user.id;

    const userResult = await client.query(
      `SELECT username, shift_group
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error("User tidak ditemukan");
    }

    const tested_by = userResult.rows[0].username;
    const shift_group = userResult.rows[0].shift_group;

    if (!shift_group) {
      throw new Error("User tidak memiliki shift_group");
    }

    /* ================= GENERATE RUNNING NUMBER ================= */

    const countResult = await client.query(
      `
      SELECT COUNT(*)
      FROM lab_pb_documents
      WHERE DATE(created_at) = CURRENT_DATE
      AND shift_group = $1
      `,
      [shift_group]
    );

    const runningNumber = String(
      parseInt(countResult.rows[0].count) + 1
    ).padStart(4, "0");

    const tag_name = `${runningNumber} ${shift_group}`;

    /* ================= AMBIL DATA BODY ================= */

    const {
      timestamp,
      board_no,
      set_weight,
      density_min,
      density_max,
      board_type,
      glue_sl,
      glue_cl,
      thick_min,
      thick_max,
      samples = [],
      ibData = {},
      bsData = {},
      screwData = {},
      densityProfileData = {},
      mcBoardData = {},
      swellingData = {},
      surfaceSoundnessData = {},
      tebalFlakesData = {},
      consHardenerData = {},
      geltimeData = {}
    } = req.body;

    if (!board_no) {
      throw new Error("Board No wajib diisi");
    }

    /* ================= DATE & TIME REALTIME ================= */

    const now = new Date();

    const jakartaFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const formatted = jakartaFormatter.format(now);

    const [datePart, timePart] = formatted.split(", ");

    const formattedDate = datePart.replace(/\//g, "");
    const formattedTime = timePart.replace(":", ".");

    /* ================= DOCUMENT NAME ================= */

    const document_name =
      `LAB PB FORM ${tag_name} ${formattedDate} ${formattedTime}`;

    /* ================= INSERT DOCUMENT ================= */

    const docResult = await client.query(
      `INSERT INTO lab_pb_documents (
        tag_name,
        document_name,
        timestamp,
        board_no,
        set_weight,
        shift_group,
        tested_by,
        density_min,
        density_max,
        board_type,
        glue_sl,
        glue_cl,
        thick_min,
        thick_max,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        NOW(),NOW()
      )
      RETURNING id`,
      [
        tag_name,
        document_name,
        timestamp || null,
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

    const positions = ['le','ml','md','mr','ri'];

    /* ================= SAMPLES ================= */

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

    /* ================= INTERNAL BONDING ================= */

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

    /* ================= BENDING STRENGTH ================= */

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

    /* ================= SCREW TEST ================= */

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

    /* ================= DENSITY PROFILE ================= */

    for (const pos of positions) {

      await client.query(
        `INSERT INTO lab_pb_density_profile
        (document_id, position, max_top, max_bot, min_value, mean_value)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          documentId,
          pos,
          densityProfileData[`max_top_${pos}`] || null,
          densityProfileData[`max_bot_${pos}`] || null,
          densityProfileData[`min_${pos}`] || null,
          densityProfileData[`mean_${pos}`] || null
        ]
      );

    }

    /* ================= MC BOARD ================= */

    for (const pos of positions) {

      await client.query(
        `INSERT INTO lab_pb_mc_board
        (document_id, position, w1, w2, mc_value, avg_w1, avg_w2, avg_mc)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          documentId,
          pos,
          mcBoardData[`w1_${pos}`] || null,
          mcBoardData[`w2_${pos}`] || null,
          null,
          mcBoardData.avg_w1 || null,
          mcBoardData.avg_w2 || null,
          mcBoardData.avg_mc || null
        ]
      );

    }

    /* ================= SWELLING ================= */

    for (const pos of positions) {

      await client.query(
        `INSERT INTO lab_pb_swelling
        (document_id, position, t1, t2, ts_value, avg_t1, avg_t2, avg_ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          documentId,
          pos,
          swellingData[`t1_${pos}`] || null,
          swellingData[`t2_${pos}`] || null,
          null,
          swellingData.avg_t1 || null,
          swellingData.avg_t2 || null,
          swellingData.avg_ts || null
        ]
      );

    }

    /* ================= SURFACE SOUNDNESS ================= */

    const surfacePositions = ['le','ri'];

    for (const pos of surfacePositions) {

      await client.query(
        `INSERT INTO lab_pb_surface_soundness
        (document_id, position, t1_value, avg_surface)
        VALUES ($1,$2,$3,$4)`,
        [
          documentId,
          pos,
          surfaceSoundnessData[`t1_${pos}_surface`] || null,
          surfaceSoundnessData.avg_surface || null
        ]
      );

    }

    /* ================= ADDITIONAL ================= */

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
      tag_name,
      document_name
    });

  } catch (err) {

    await client.query('ROLLBACK');

    console.error("❌ ERROR SIMPAN LAB PB:", err);

    res.status(500).json({
      error: "Gagal simpan Lab PB: " + err.message
    });

  } finally {

    client.release();

  }

});

/* =========================
   LIST DOKUMEN LAB PB (GET) - FIXED (tanpa title)
========================= */
app.get('/api/lab-pb-documents', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        tag_name,
        document_name,  -- 🔥 TAMBAHKAN INI
        board_no,
        shift_group,
        tested_by,
        timestamp,
        created_at,
        updated_at
      FROM lab_pb_documents
      ORDER BY created_at DESC
    `);

    const documents = result.rows.map(doc => ({
      id: doc.id,
      tag_name: doc.tag_name,
      document_name: doc.document_name, // 🔥 TAMBAHKAN INI
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
    console.error("❌ ERROR GET DOCUMENTS:", err);
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
app.put('/api/lab-pb/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    /* ================= AMBIL USER DARI DATABASE ================= */

    const userId = req.user.id;

    const userResult = await client.query(
      `SELECT role, shift_group 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: "User tidak valid" });
    }

    const userRole = userResult.rows[0].role;
    const userShift = userResult.rows[0].shift_group;

    /* ================= CEK DOKUMEN ================= */

    const docCheck = await client.query(
      `SELECT shift_group 
       FROM lab_pb_documents 
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (docCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const docShift = docCheck.rows[0].shift_group;

    /* ================= PROTEKSI SHIFT ================= */

    const isSupervisor = userRole === 'supervisor';

    if (!isSupervisor && docShift !== userShift) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: "Tidak boleh edit dokumen shift lain"
      });
    }

    /* ================= AMBIL DATA BODY ================= */

    const {
      timestamp,
      board_no,
      set_weight,
      density_min,
      density_max,
      board_type,
      glue_sl,
      glue_cl,
      thick_min,
      thick_max,
      samples = [],
      ibData = {},
      bsData = {},
      screwData = {},
      densityProfileData = {},
      mcBoardData = {},
      swellingData = {},
      surfaceSoundnessData = {},
      tebalFlakesData = {},
      consHardenerData = {},
      geltimeData = {}
    } = req.body;

    if (!board_no) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: "Board No wajib diisi"
      });
    }

    /* ================= UPDATE DOCUMENT ================= */

    const updateDoc = await client.query(
      `
      UPDATE lab_pb_documents SET
        timestamp = $1,
        board_no = $2,
        set_weight = $3,
        density_min = $4,
        density_max = $5,
        board_type = $6,
        glue_sl = $7,
        glue_cl = $8,
        thick_min = $9,
        thick_max = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING id
      `,
      [
        timestamp || null,
        board_no,
        set_weight || null,
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

    if (updateDoc.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: "Dokumen gagal diupdate"
      });
    }

    /* ================= HAPUS CHILD LAMA ================= */

    await client.query('DELETE FROM lab_pb_samples WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_internal_bonding WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_bending_strength WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_screw_test WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_density_profile WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_mc_board WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_swelling WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_surface_soundness WHERE document_id = $1', [id]);
    await client.query('DELETE FROM lab_pb_additional_tests WHERE document_id = $1', [id]);

    /* ================= INSERT ULANG DATA ================= */

    const positions = ['le', 'ml', 'md', 'mr', 'ri'];

    // Samples
    for (const sample of samples) {
      await client.query(
        `INSERT INTO lab_pb_samples
        (document_id, sample_no, weight_gr, thickness_mm, length_mm, width_mm)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    // Internal Bonding
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_internal_bonding
        (document_id, position, ib_value, density_value, avg_ib, avg_density)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    // Bending Strength
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_bending_strength
        (document_id, position, mor_value, density_value, avg_mor, avg_density)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    // Screw Test
    for (const pos of positions) {
      await client.query(
        `INSERT INTO lab_pb_screw_test
        (document_id, position, face_value, edge_value, avg_face, avg_edge)
        VALUES ($1,$2,$3,$4,$5,$6)`,
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

    await client.query('COMMIT');

    res.json({
      message: "Laporan Lab PB berhasil diperbarui",
      documentId: id
    });

  } catch (err) {
    await client.query('ROLLBACK');

    console.error("❌ ERROR UPDATE LAB PB:", err);

    res.status(500).json({
      error: "Gagal memperbarui laporan Lab PB: " + err.message
    });

  } finally {
    client.release();
  }
});

/* =========================
   HAPUS DOKUMEN (DELETE)
========================= */
app.delete('/api/lab-pb-documents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    /* ================= AMBIL USER DARI DATABASE ================= */

    const userId = req.user.id;

    const userResult = await client.query(
      `SELECT role, shift_group 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: "User tidak valid" });
    }

    const userRole = userResult.rows[0].role;
    const userShift = userResult.rows[0].shift_group;

    /* ================= CEK DOKUMEN ================= */

    const docCheck = await client.query(
      `
      SELECT shift_group, tag_name
      FROM lab_pb_documents
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (docCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    const docShift = docCheck.rows[0].shift_group;
    const tagName = docCheck.rows[0].tag_name;

    /* ================= PROTEKSI SHIFT ================= */

    const isSupervisor = userRole === 'supervisor';

    if (!isSupervisor && docShift !== userShift) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: "Tidak boleh menghapus dokumen shift lain"
      });
    }

    /* ================= HAPUS CHILD TABLE ================= */

    await client.query(`DELETE FROM lab_pb_samples WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_internal_bonding WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_bending_strength WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_screw_test WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_density_profile WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_mc_board WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_swelling WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_surface_soundness WHERE document_id = $1`, [id]);
    await client.query(`DELETE FROM lab_pb_additional_tests WHERE document_id = $1`, [id]);

    /* ================= HAPUS DOKUMEN ================= */

    const deleteResult = await client.query(
      `
      DELETE FROM lab_pb_documents 
      WHERE id = $1 
      RETURNING id
      `,
      [id]
    );

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Dokumen gagal dihapus" });
    }

    await client.query('COMMIT');

    res.json({
      message: `Dokumen Lab PB ${tagName} berhasil dihapus`,
      documentId: id
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR HAPUS DOKUMEN:", err);

    res.status(500).json({
      error: "Gagal menghapus dokumen: " + err.message
    });

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


app.get("/api/lab-pb-test", authenticateToken, async (req, res) => {

  try {

    const { type, search, from, to } = req.query;

    if (!type) {
      return res.status(400).json({ error: "type required" });
    }

    let query = "";
    const params = [];
    let i = 1;

    /* ================= INTERNAL BONDING ================= */

    if (type === "internal-bonding") {

      query = `
      SELECT
        d.timestamp,
        d.document_name,
        d.shift_group,
        MAX(t.avg_ib) AS result
      FROM lab_pb_documents d
      LEFT JOIN lab_pb_internal_bonding t
      ON t.document_id = d.id
      WHERE 1=1
      `;

    }

    /* ================= BENDING ================= */

    else if (type === "bending") {

      query = `
      SELECT
        d.timestamp,
        d.document_name,
        d.shift_group,
        MAX(t.avg_mor) AS result
      FROM lab_pb_documents d
      LEFT JOIN lab_pb_bending_strength t
      ON t.document_id = d.id
      WHERE 1=1
      `;

    }

    /* ================= DENSITY PROFILE ================= */

    else if (type === "density") {

      query = `
      SELECT
        d.timestamp,
        d.document_name,
        d.shift_group,
        MAX(t.mean_value) AS result
      FROM lab_pb_documents d
      LEFT JOIN lab_pb_density_profile t
      ON t.document_id = d.id
      WHERE 1=1
      `;

    }

    /* ================= MC BOARD ================= */

    else if (type === "mc") {

      query = `
      SELECT
        d.timestamp,
        d.document_name,
        d.shift_group,
        MAX(t.avg_mc) AS result
      FROM lab_pb_documents d
      LEFT JOIN lab_pb_mc_board t
      ON t.document_id = d.id
      WHERE 1=1
      `;

    }

    /* ================= SURFACE ================= */

    else if (type === "surface") {

      query = `
      SELECT
        d.timestamp,
        d.document_name,
        d.shift_group,
        MAX(t.avg_surface) AS result
      FROM lab_pb_documents d
      LEFT JOIN lab_pb_surface_soundness t
      ON t.document_id = d.id
      WHERE 1=1
      `;

    }

    else {
      return res.status(400).json({ error: "invalid test type" });
    }

    /* ================= SEARCH ================= */

    if (search) {

      query += `
      AND (
        d.document_name ILIKE $${i}
        OR d.shift_group ILIKE $${i}
      )
      `;

      params.push(`%${search}%`);
      i++;

    }

    /* ================= DATE FILTER ================= */

    if (from) {
      query += ` AND DATE(d.timestamp) >= $${i++}`;
      params.push(from);
    }

    if (to) {
      query += ` AND DATE(d.timestamp) <= $${i++}`;
      params.push(to);
    }

    /* ================= GROUP & ORDER ================= */

    query += `
      GROUP BY d.id, d.timestamp, d.document_name, d.shift_group
      ORDER BY d.timestamp DESC
      LIMIT 200
    `;

    const result = await pool.query(query, params);

    res.json({
      data: result.rows
    });

  } catch (err) {

    console.error("Supervisor Test Error:", err);

    res.status(500).json({
      error: "Server error",
      detail: err.message
    });

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