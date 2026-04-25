const oracledb = require('oracledb');
require('dotenv').config({ path: './.env' });

async function checkUser() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const email = 'feliciencalylx@gmail.com';
    const result = await connection.execute(
      `SELECT email, verification_code, is_verified FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('User status:', JSON.stringify(result.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

checkUser();
