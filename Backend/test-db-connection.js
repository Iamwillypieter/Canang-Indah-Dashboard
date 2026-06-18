import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err.stack);
  } else {
    console.log('Connected successfully at:', res.rows[0].now);
  }
  pool.end();
});