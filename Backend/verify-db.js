import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: './.env' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not defined in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function verify() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, username, role, shift_group FROM users');
    console.log('👥 Users in database:');
    res.rows.forEach(row => {
      console.log(`  - ${row.username} (${row.role}) shift_group: ${row.shift_group}`);
    });
  } catch (err) {
    console.error('❌ Error verifying:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
