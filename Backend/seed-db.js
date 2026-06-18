import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';

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

async function seed() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync('../db/seed.sql', 'utf8');
    console.log('🌱 Seeding database...');
    await client.query(sql);
    console.log('✅ Seeding completed!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
