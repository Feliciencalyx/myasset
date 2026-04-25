const oracledb = require('oracledb');
require('dotenv').config({ path: './.env' });

async function debugNotifications() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const email = 'feliciencalylx@gmail.com';
    const userResult = await conn.execute(
      `SELECT id, family_id, name FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('Target User:', JSON.stringify(user, null, 2));

    const fid = user.FAMILY_ID;

    const notifs = await conn.execute(
      `SELECT n.id, n.user_id, n.type, n.message, n.created_at, u.name as user_name 
       FROM notifications n 
       LEFT JOIN users u ON n.user_id = u.id 
       WHERE n.family_id = :fid`,
      [fid],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Found ${notifs.rows.length} notifications for family ${fid}`);
    console.log(JSON.stringify(notifs.rows, null, 2));

    const assets = await conn.execute(
      `SELECT id, title, family_id FROM land_assets WHERE family_id = :fid`,
      [fid],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`Found ${assets.rows.length} land assets for family ${fid}`);
    console.log(JSON.stringify(assets.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.close();
  }
}

debugNotifications();
