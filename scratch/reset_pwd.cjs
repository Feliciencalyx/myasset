
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function resetPassword() {
  let connection;
  try {
    const config = {
      user: process.env.ORACLE_USER || 'system',
      password: process.env.ORACLE_PASSWORD || 'mine',
      connectString: process.env.ORACLE_CONN_STRING || 'localhost:1521/FREE'
    };
    connection = await oracledb.getConnection(config);
    const newPassword = '123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await connection.execute(
      `UPDATE users SET password_hash = :pass WHERE email = :email`,
      { pass: hashedPassword, email: 'child1@gmail.com' },
      { autoCommit: true }
    );
    console.log('Password for child1@gmail.com has been reset to "123"');
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

resetPassword();
