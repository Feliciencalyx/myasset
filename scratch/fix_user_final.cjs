const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './.env' });

async function fixUserFinal() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING
    });

    const email = 'feliciencalylx@gmail.com';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('Cleaning up...');
    await connection.execute(`DELETE FROM users WHERE LOWER(email) = LOWER(:email)`, [email], { autoCommit: true });

    console.log('Creating verified user with known password...');
    const id = Date.now().toString();
    const fId = 'EST888'; // Custom Estate ID
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, name, role, family_id, is_verified) VALUES (:id, :email, :pass, :name, :role, :fid, 1)`,
      { id, email, pass: passwordHash, name: 'Felicien Calyx', role: 'ADMIN', fid: fId },
      { autoCommit: true }
    );

    console.log('User created and verified.');
    console.log('Email:', email);
    console.log('Temporary Password: Password123!');

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

fixUserFinal();
