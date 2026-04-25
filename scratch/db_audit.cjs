const oracledb = require('oracledb');
require('dotenv').config({ path: './.env' });

async function checkCounts() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const tables = ['users', 'land_assets', 'notifications', 'residential_assets', 'vehicles'];
    for (const table of tables) {
      const result = await conn.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result.rows[0][0]}`);
    }

    const lastNotifs = await conn.execute(
      `SELECT * FROM notifications ORDER BY created_at DESC FETCH FIRST 5 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('Last 5 Notifications:', JSON.stringify(lastNotifs.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.close();
  }
}

checkCounts();
