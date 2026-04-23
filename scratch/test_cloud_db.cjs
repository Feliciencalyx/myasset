const oracledb = require('oracledb');
async function run() {
  let connection;
  try {
    console.log('Testing connection to MyAsset2...');
    connection = await oracledb.getConnection({
      user: 'ADMIN',
      password: 'Logoutin@800',
      connectString: '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.af-johannesburg-1.oraclecloud.com))(connect_data=(service_name=g89b8c9d70a204e_myasset2_low.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))'
    });
    console.log('SUCCESS! Connected to Oracle Cloud.');
  } catch (err) {
    console.error('DIAGNOSTIC ERROR:', err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
run();
