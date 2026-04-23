
const oracledb = require('oracledb');
require('dotenv').config();

async function testConnection() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER || 'system',
      password: process.env.DB_PASSWORD || 'mine',
      connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/FREE'
    });
    console.log('SUCCESS: Connected to Oracle Database');
    const result = await connection.execute('SELECT user FROM dual');
    console.log('Result:', result.rows);
  } catch (err) {
    console.error('FAILURE: Could not connect to Oracle Database');
    console.error(err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

testConnection();
