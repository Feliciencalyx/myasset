const oracledb = require('oracledb');
require('dotenv').config({ path: './.env' });

async function fixUser() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const email = 'feliciencalylx@gmail.com';
    
    console.log('Deleting duplicate/unverified entries...');
    await connection.execute(
      `DELETE FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { autoCommit: true }
    );

    console.log('Creating fresh verified user...');
    const id = Date.now().toString();
    const fId = 'G89B8C'; // Sample family ID or generate one
    await connection.execute(
      `INSERT INTO users (id, email, name, role, family_id, is_verified) VALUES (:id, :email, :name, :role, :fid, 1)`,
      { id, email, name: 'Felicien Calyx', role: 'ADMIN', fid: fId },
      { autoCommit: true }
    );

    console.log('User verified successfully.');

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

fixUser();
