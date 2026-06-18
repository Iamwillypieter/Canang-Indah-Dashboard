import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: './.env' });

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not defined in .env file');
  process.exit(1);
}

// Create a new pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Function to get all tables in the public schema
async function getTables(client) {
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  return res.rows.map(row => row.table_name);
}

// Function to get columns for a table
async function getColumns(client, tableName) {
  const res = await client.query(`
    SELECT 
      column_name.column_name,
      column_name.data_type,
      column_name.character_maximum_length,
      column_name.is_nullable,
      column_name.column_default,
      CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
    FROM information_schema.columns AS column_name
    LEFT JOIN (
      SELECT ku.table_name, ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
        AND tc.table_name = ku.table_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
    ) pk ON pk.table_name = column_name.table_name 
          AND pk.column_name = column_name.column_name
    WHERE column_name.table_name = $1
      AND column_name.table_schema = 'public'
    ORDER BY column_name.ordinal_position;
  `, [tableName]);
  return res.rows;
}

// Function to get foreign keys for a table
async function getForeignKeys(client, tableName) {
  const res = await client.query(`
    SELECT
      ku.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS ku
      ON tc.constraint_name = ku.constraint_name
      AND tc.table_schema = ku.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public';
  `, [tableName]);
  return res.rows;
}

// Function to generate CREATE TABLE statement
function createCreateTableStatement(tableName, columns, foreignKeys) {
  let sql = `CREATE TABLE ${tableName} (\n`;
  const columnDefinitions = columns.map(col => {
    let def = `  ${col.column_name} ${col.data_type}`;
    if (col.character_maximum_length !== null) {
      def += `(${col.character_maximum_length})`;
    }
    if (col.column_default !== null) {
      def += ` DEFAULT ${col.column_default}`;
    }
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    if (col.is_primary_key) {
      def += ' PRIMARY KEY';
    }
    return def;
  });
  sql += columnDefinitions.join(',\n');
  // Add foreign key constraints
  if (foreignKeys.length > 0) {
    const fkConstraints = foreignKeys.map(fk => {
      return `  FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name})`;
    });
    sql += ',\n' + fkConstraints.join(',\n');
  }
  sql += '\n);';
  return sql;
}

// Main function
async function main() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connected to database');
    const tables = await getTables(client);
    console.log(`📊 Found ${tables.length} tables: ${tables.join(', ')}`);

    // Ensure db directory exists in the root
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbDir = path.join(__dirname, '../db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir);
    }

    for (const tableName of tables) {
      console.log(`📝 Processing table: ${tableName}`);
      const columns = await getColumns(client, tableName);
      const foreignKeys = await getForeignKeys(client, tableName);
      const createTableSql = createCreateTableStatement(tableName, columns, foreignKeys);
      const filePath = path.join(dbDir, `${tableName}.sql`);
      fs.writeFileSync(filePath, createTableSql, { utf8: true });
      console.log(`✅ Written to ${filePath}`);
    }
    console.log('🎉 Schema dump completed!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
