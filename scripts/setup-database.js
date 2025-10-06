const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
  const connectionString = process.env.DIRECT_URL;

  if (!connectionString) {
    console.error('❌ DIRECT_URL not found in .env file');
    process.exit(1);
  }

  console.log('Using connection string:', connectionString.replace(/:[^:@]+@/, ':****@'));

  const client = new Client({
    connectionString,
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('✓ Connected successfully');

    console.log('\nReading SQL schema file...');
    const sqlPath = path.join(__dirname, '..', 'supabase-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('✓ SQL schema loaded');

    console.log('\nExecuting SQL schema...');
    await client.query(sql);
    console.log('✓ Database schema created successfully!');

    console.log('\nVerifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n✓ Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
