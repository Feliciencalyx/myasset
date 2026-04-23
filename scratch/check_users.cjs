
const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUsers() {
  let connection;
  try {
    const config = {
      user: process.env.ORACLE_USER || 'system',
      password: process.env.ORACLE_PASSWORD || 'mine',
      connectString: process.env.ORACLE_CONN_STRING || 'localhost:1521/FREE'
    };
    connection = await oracledb.getConnection(config);
    const result = await connection.execute('SELECT id, email, full_name, role FROM users', [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log('Users in database:', result.rows);
  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

checkUsers();
