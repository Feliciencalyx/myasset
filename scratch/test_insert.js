const oracledb = require('oracledb');
async function test() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'system',
      password: 'mine',
      connectString: 'localhost:1521/FREE'
    });
    await conn.execute(
      `INSERT INTO land_assets (id, upi, title, address, zoning, master_plan, size_ha, purchase_date, expiry_date, status, valuation, lat, lng, family_id) 
       VALUES (:id, :upi, :title, :addr, :zoning, :mp, :size, :pd, :ed, :status, :val, :lat, :lng, :fid)`,
      {
        id: 'test-123',
        upi: '1/03/04/05/1234',
        title: 'Manual Registry Entry',
        addr: 'Kigali City Center',
        zoning: 'R1',
        mp: 'Kigali Master Plan 2030',
        size: '1.2 HA',
        pd: 'FEB 10, 2024',
        ed: 'FEB 10, 2054',
        status: 'ACTIVE',
        val: '$450,000',
        lat: -1.9441,
        lng: 30.0619,
        fid: '12345'
      },
      { autoCommit: true }
    );
    console.log('Record inserted successfully');
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.close();
  }
}
test();
