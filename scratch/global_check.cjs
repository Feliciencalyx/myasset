const oracledb = require('oracledb');
require('dotenv').config({ path: './.env' });

async function globalCheck() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const assets = await conn.execute(
      `SELECT title, family_id FROM land_assets`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('All Land Assets:', JSON.stringify(assets.rows, null, 2));

    const users = await conn.execute(
      `SELECT email, family_id, name FROM users`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('All Users:', JSON.stringify(users.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.close();
  }
}

globalCheck();
