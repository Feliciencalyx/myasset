import express from 'express';
import oracledb from 'oracledb';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

dotenv.config();

const app = express();
app.use(compression()); 
const PORT = process.env.PORT || 3005;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'estate-master-key-2026';

app.use(express.json({ limit: '50mb' }));
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(cors({
  origin: true, 
  credentials: true
}));
app.use(cookieParser());

app.use(helmet({
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/auth/', limiter);

let resendClient = new Resend(process.env.RESEND_API_KEY || 'no-key-yet');
const getEmailSender = () => process.env.EMAIL_SENDER || 'onboarding@resend.dev';

async function createNotification(userId: string, familyId: string, type: string, message: string) {
  if (!userId || !familyId) return;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    await connection.execute(
      `INSERT INTO notifications (id, user_id, family_id, type, message) VALUES (:id, :uid, :fid, :type, :msg)`,
      { id: Date.now().toString() + Math.random().toString(36).substring(7), uid: userId, fid: familyId, type, msg: message },
      { autoCommit: true }
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  } finally {
    if (connection) await connection.close();
  }
}

async function generateUniqueFamilyId(connection: any): Promise<string> {
  let id = '';
  let exists = true;
  while (exists) {
    id = Math.random().toString(36).substring(7).toUpperCase();
    const result: any = await connection.execute(
      `SELECT COUNT(*) as count FROM users WHERE family_id = :id`,
      [id]
    );
    const count = result.rows[0] ? (result.rows[0][0] || result.rows[0].COUNT) : 0;
    if (count === 0) exists = false;
  }
  return id;
}

const dbConfig = {
  user: process.env.ORACLE_USER || 'system',
  password: process.env.ORACLE_PASSWORD || 'mine',
  connectString: process.env.ORACLE_CONN_STRING || 'localhost:1521/FREE',
  poolMin: 0,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  queueTimeout: 10000
};

let pool: oracledb.Pool | null = null;
let poolPromise: Promise<oracledb.Pool> | null = null;

async function getPool() {
  if (pool) return pool;
  if (poolPromise) return poolPromise;
  poolPromise = (async () => {
    try {
      pool = await oracledb.createPool(dbConfig);
      console.log('Successfully created Oracle Database Pool');
      return pool;
    } catch (err) {
      poolPromise = null;
      console.error('Failed to create pool:', err);
      throw err;
    }
  })();
  return poolPromise;
}

async function initializeDatabase() {
  if (poolInitialized) return;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    console.log('Database connected. Checking schema...');
    
    const tables = [
      `CREATE TABLE users (
        id VARCHAR2(255) PRIMARY KEY,
        email VARCHAR2(255) UNIQUE,
        password_hash VARCHAR2(255),
        name VARCHAR2(255),
        role VARCHAR2(50),
        family_id VARCHAR2(255),
        photo_url CLOB,
        reset_code VARCHAR2(10),
        reset_expiry TIMESTAMP,
        is_verified NUMBER(1) DEFAULT 0,
        verification_code VARCHAR2(10)
      )`,
      `CREATE TABLE notifications (
        id VARCHAR2(255) PRIMARY KEY,
        user_id VARCHAR2(255),
        family_id VARCHAR2(255),
        type VARCHAR2(50),
        message VARCHAR2(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read NUMBER(1) DEFAULT 0
      )`,
      `CREATE TABLE land_assets (
        id VARCHAR2(255) PRIMARY KEY,
        upi VARCHAR2(255),
        title VARCHAR2(255),
        address VARCHAR2(255),
        zoning VARCHAR2(255),
        master_plan VARCHAR2(255),
        size_ha VARCHAR2(255),
        purchase_date VARCHAR2(255),
        expiry_date VARCHAR2(255),
        status VARCHAR2(50),
        valuation VARCHAR2(255),
        lat NUMBER,
        lng NUMBER,
        family_id VARCHAR2(255)
      )`,
      `CREATE TABLE residential_assets (
        id VARCHAR2(255) PRIMARY KEY,
        name VARCHAR2(255),
        location VARCHAR2(255),
        status VARCHAR2(50),
        tenant VARCHAR2(255),
        lease_start VARCHAR2(255),
        lease_end VARCHAR2(255),
        monthly_rent VARCHAR2(255),
        valuation VARCHAR2(255),
        appreciation VARCHAR2(255),
        img_url CLOB,
        family_id VARCHAR2(255),
        linked_upi VARCHAR2(255)
      )`,
      `CREATE TABLE vehicles (
        id VARCHAR2(255) PRIMARY KEY,
        model VARCHAR2(255),
        reg VARCHAR2(255),
        insurance_expiry VARCHAR2(255),
        status VARCHAR2(50),
        owner VARCHAR2(255),
        location VARCHAR2(255),
        last_service VARCHAR2(255),
        img_url CLOB,
        family_id VARCHAR2(255)
      )`
    ];

    for (const sql of tables) {
      try {
        await connection.execute(sql);
      } catch (e: any) {
        if (!e.message.includes('ORA-00955')) throw e;
      }
    }

    try { await connection.execute(`ALTER TABLE users ADD is_verified NUMBER(1) DEFAULT 0`); } catch(e) {}
    try { await connection.execute(`ALTER TABLE users ADD verification_code VARCHAR2(10)`); } catch(e) {}
    
    console.log('Database tables verified/created');
  } catch (err: any) {
    console.error('CRITICAL: Database Initialization Error:', err.message);
    poolInitialized = false;
  } finally {
    if (connection) await connection.close();
  }
}

let poolInitialized = false;
let initializing: Promise<void> | null = null;

app.use('/api', async (req, res, next) => {
  if (!poolInitialized && !req.path.startsWith('/system/setup')) {
    if (!initializing) {
      initializing = initializeDatabase().then(() => {
        poolInitialized = true;
        initializing = null;
      }).catch(err => {
        console.error('Lazy Init Failed:', err);
        initializing = null;
      });
    }
    await initializing;
  }
  next();
});

async function startServer() {
  if (!process.env.VERCEL) {
    try {
      await initializeDatabase();
      poolInitialized = true;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
    }
  }
}

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ 
    error: 'A server-side exception occurred.',
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined
  });
});

if (NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

startServer();

const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// --- API Endpoints ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, role, familyId } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();

    if (role === 'USER') {
      if (!familyId) return res.status(400).json({ error: 'Family Estate ID is required to join a household.' });
      const checkFid: any = await connection.execute(
        `SELECT COUNT(*) as count FROM users WHERE family_id = :fid`,
        [familyId]
      );
      const count = checkFid.rows[0] ? (checkFid.rows[0][0] || checkFid.rows[0].COUNT) : 0;
      if (count === 0) return res.status(400).json({ error: 'Invalid Family Estate ID.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    let fId = familyId;
    if (role === 'ADMIN') fId = await generateUniqueFamilyId(connection);
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, name, role, family_id, is_verified, verification_code) 
       VALUES (:id, :email, :pass, :name, :role, :fid, 0, :vcode)`,
      { id, email, pass: hashedPassword, name: fullName, role, fid: fId, vcode: verificationCode },
      { autoCommit: true }
    );

    try {
      console.log(`Sending verification email to: ${email}`);
      if (process.env.RESEND_API_KEY) {
        await resendClient.emails.send({
          from: `MyAsset Security <${getEmailSender()}>`,
          to: email,
          subject: 'Verify Your MyAsset Account',
          html: `<div style="font-family: sans-serif; padding: 20px;">
                  <h2 style="color: #6200ee;">Welcome, ${fullName}!</h2>
                  <p>Your verification code is:</p>
                  <h1 style="font-size: 3em; letter-spacing: 10px; color: #6200ee;">${verificationCode}</h1>
                </div>`
        });
        console.log('Email sent successfully');
      }
    } catch (e) { console.error('Email failed:', e); }

    res.json({ success: true, message: 'Verification code sent.' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Operation failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { email, role: requestedRole, familyId: requestedFamilyId } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let user = result.rows[0];
    if (!user) {
      const id = Date.now().toString();
      const role = requestedRole || 'USER';
      const fId = role === 'ADMIN' ? await generateUniqueFamilyId(connection) : (requestedFamilyId || '');
      await connection.execute(
        `INSERT INTO users (id, email, name, role, family_id, is_verified) VALUES (:id, :email, :name, :role, :fid, 1)`,
        { id, email, name: email.split('@')[0], role, fid: fId },
        { autoCommit: true }
      );
      const newResult: any = await connection.execute(`SELECT * FROM users WHERE id = :id`, [id], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      user = newResult.rows[0];
    }

    const token = jwt.sign({ userId: user.ID, email: user.EMAIL, role: user.ROLE, familyId: user.FAMILY_ID }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, secure: NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.ID, email: user.EMAIL, fullName: user.NAME, role: user.ROLE, familyId: user.FAMILY_ID } });
  } catch (err) { res.status(500).json({ error: 'Google auth failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = result.rows[0];
    if (user && user.PASSWORD_HASH) {
      if (user.IS_VERIFIED === 0) return res.status(403).json({ error: 'Verify email first.', needsVerification: true, email: user.EMAIL });
      if (await bcrypt.compare(password, user.PASSWORD_HASH)) {
        const token = jwt.sign({ userId: user.ID, email: user.EMAIL, role: user.ROLE, familyId: user.FAMILY_ID }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' });
        return res.json({ user: { id: user.ID, email: user.EMAIL, fullName: user.NAME, role: user.ROLE, familyId: user.FAMILY_ID } });
      }
    }
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) { res.status(500).json({ error: 'Login failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/auth/verify-email', async (req, res) => {
  const { email, code } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(:email) AND verification_code = :code`,
      { email, code },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid code.' });
    await connection.execute(`UPDATE users SET is_verified = 1, verification_code = NULL WHERE LOWER(email) = LOWER(:email)`, { email }, { autoCommit: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Verification failed.' }); } finally { if (connection) await connection.close(); }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT id, email, name, role, family_id, DBMS_LOB.GETLENGTH(photo_url) as photo_len FROM users WHERE id = :id`,
      [req.user.userId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    let photoUrl = '';
    if (user.PHOTO_LEN > 0) {
      const full: any = await connection.execute(`SELECT photo_url FROM users WHERE id = :id`, [req.user.userId], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      if (full.rows[0]?.PHOTO_URL) photoUrl = await full.rows[0].PHOTO_URL.getData();
    }
    res.json({ user: { id: user.ID, email: user.EMAIL, fullName: user.NAME, role: user.ROLE, familyId: user.FAMILY_ID, photoUrl } });
  } catch (err) { res.status(500).json({ error: 'Fetch failed.' }); } finally { if (connection) await connection.close(); }
});

app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
  const { fullName, photoUrl } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    await connection.execute(
      `UPDATE users SET name = :name, photo_url = :photo WHERE id = :id`,
      { name: fullName, photo: { val: photoUrl || '', type: oracledb.DB_TYPE_CLOB }, id: req.user.userId },
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Update failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(`SELECT * FROM users WHERE LOWER(email) = LOWER(:email)`, [email], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found.' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = new Date(); exp.setHours(exp.getHours() + 1);
    await connection.execute(`UPDATE users SET reset_code = :code, reset_expiry = :exp WHERE LOWER(email) = LOWER(:email)`, { code, exp, email }, { autoCommit: true });
    if (process.env.RESEND_API_KEY) {
      await resendClient.emails.send({
        from: `MyAsset Security <${getEmailSender()}>`,
        to: email,
        subject: 'Reset Password',
        html: `Code: ${code}`
      });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Reset failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/auth/confirm-reset', async (req, res) => {
  const { email, code, newPassword } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(:email) AND reset_code = :code AND reset_expiry > CURRENT_TIMESTAMP`,
      { email, code },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid code.' });
    const hash = await bcrypt.hash(newPassword, 10);
    await connection.execute(`UPDATE users SET password_hash = :pass, reset_code = NULL, reset_expiry = NULL WHERE LOWER(email) = LOWER(:email)`, { pass: hash, email }, { autoCommit: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); } finally { if (connection) await connection.close(); }
});

// Assets Endpoints
app.get('/api/assets/land', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result = await connection.execute(`SELECT * FROM land_assets WHERE family_id = :fid`, [req.user.familyId || ''], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Fetch failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/assets/land', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const asset = req.body;
    const id = Date.now().toString();
    await connection.execute(
      `INSERT INTO land_assets (id, upi, title, address, zoning, master_plan, size_ha, purchase_date, expiry_date, status, valuation, lat, lng, family_id)
       VALUES (:id, :upi, :title, :address, :zoning, :master_plan, :sz, :pd, :ed, :status, :val, :lat, :lng, :fid)`,
      { id, upi: asset.upi, title: asset.title, address: asset.address, zoning: asset.zoning, master_plan: asset.masterPlan, sz: asset.size, pd: asset.purchaseDate, ed: asset.expiryDate, status: asset.status, val: asset.valuation, lat: asset.location.lat, lng: asset.location.lng, fid: req.user.familyId || '' },
      { autoCommit: true }
    );
    res.json({ id, ...asset });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); } finally { if (connection) await connection.close(); }
});

app.get('/api/family/members', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(`SELECT id, email, name, role, family_id, photo_url FROM users WHERE family_id = :fid`, [req.user.familyId || ''], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const members = await Promise.all(result.rows.map(async (row: any) => {
      let photoUrl = '';
      if (row.PHOTO_URL) photoUrl = await row.PHOTO_URL.getData();
      return { id: row.ID, email: row.EMAIL, name: row.NAME, role: row.ROLE, familyId: row.FAMILY_ID, photoUrl, status: 'ACTIVE' };
    }));
    res.json(members);
  } catch (err) { res.status(500).json({ error: 'Fetch failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/family/members', authenticateToken, authorizeAdmin, async (req: any, res) => {
  const { email, password, fullName, role } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const hash = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, name, role, family_id) VALUES (:id, :email, :pass, :name, :role, :fid)`,
      [id, email, hash, fullName, role, req.user.familyId],
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); } finally { if (connection) await connection.close(); }
});

app.get('/api/notifications', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT n.*, u.name as user_name FROM notifications n JOIN users u ON n.user_id = u.id WHERE n.family_id = :fid ORDER BY n.created_at DESC`,
      [req.user.familyId || ''],
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 50 }
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Fetch failed.' }); } finally { if (connection) await connection.close(); }
});

export default app;
