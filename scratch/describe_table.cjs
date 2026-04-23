
const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function describeTable() {
  let connection;
  try {
    const config = {
      user: process.env.ORACLE_USER || 'system',
      password: process.env.ORACLE_PASSWORD || 'mine',
      connectString: process.env.ORACLE_CONN_STRING || 'localhost:1521/FREE'
    };
    connection = await oracledb.getConnection(config);
    const result = await connection.execute('SELECT * FROM users FETCH FIRST 1 ROWS ONLY', [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log('Metadata:', result.metaData);
  } catch (err) {
    console.error('Error describing table:', err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

describeTable();
