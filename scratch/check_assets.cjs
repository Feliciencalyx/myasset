const oracledb = require('oracledb');
require('dotenv').config({ path: './.env' });

async function checkData() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const email = 'feliciencalylx@gmail.com';
    const userResult = await conn.execute(
      `SELECT id, family_id FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const user = userResult.rows[0];
    const fid = user.FAMILY_ID;
    console.log(`User ID: ${user.ID}, Family ID: ${fid}`);

    const landResult = await conn.execute(
      `SELECT * FROM land_assets WHERE family_id = :fid`,
      [fid],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`Land Assets (${landResult.rows.length}):`);
    console.log(JSON.stringify(landResult.rows, null, 2));

    const notifResult = await conn.execute(
      `SELECT * FROM notifications WHERE family_id = :fid`,
      [fid],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`Notifications (${notifResult.rows.length}):`);
    console.log(JSON.stringify(notifResult.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.close();
  }
}

checkData();
