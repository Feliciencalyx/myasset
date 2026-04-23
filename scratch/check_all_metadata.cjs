
const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkMetadata(table) {
  let connection;
  try {
    const config = {
      user: process.env.ORACLE_USER || 'system',
      password: process.env.ORACLE_PASSWORD || 'mine',
      connectString: process.env.ORACLE_CONN_STRING || 'localhost:1521/FREE'
    };
    connection = await oracledb.getConnection(config);
    const result = await connection.execute(`SELECT * FROM ${table} FETCH FIRST 1 ROWS ONLY`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log(`Metadata for ${table}:`, result.metaData.map(m => m.name));
  } catch (err) {
    console.error(`Error checking ${table}:`, err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function run() {
    await checkMetadata('land_assets');
    await checkMetadata('residential_assets');
    await checkMetadata('vehicles');
}
run();
