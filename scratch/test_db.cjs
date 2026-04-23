
const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  let connection;
  try {
    const config = {
      user: process.env.ORACLE_USER || 'system',
      password: process.env.ORACLE_PASSWORD || 'mine',
      connectString: process.env.ORACLE_CONN_STRING || 'localhost:1521/FREE'
    };
    console.log('Testing connection with:', config.user, '@', config.connectString);
    connection = await oracledb.getConnection(config);
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
