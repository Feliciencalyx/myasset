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
app.use(compression()); // Compress all responses
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'estate-master-key-2026';

app.use(express.json({ limit: '50mb' }));
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(cors({
  origin: true, // More permissive for dev
  credentials: true
}));
app.use(cookieParser());

// Security & Optimization
app.use(helmet({
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15)
  max: 500, // Increased from 100 to avoid throttling legitimate reloads
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to auth endpoints
app.use('/api/auth/', limiter);

// Helper to get fresh transporter
let resendClient = new Resend(process.env.RESEND_API_KEY || 'no-key-yet');
const getEmailSender = () => process.env.EMAIL_SENDER || 'onboarding@resend.dev';

// Activity Logger
async function createNotification(userId: string, familyId: string, type: string, message: string) {
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

const dbConfig = {
  user: process.env.ORACLE_USER || 'system',
  password: process.env.ORACLE_PASSWORD || 'mine',
  connectString: process.env.ORACLE_CONN_STRING || 'localhost:1521/FREE',
  poolMin: 0,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60, // Keep connections alive for 60s in the pool if warm
  queueTimeout: 10000 // Fail faster if queue is full (10s)
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
      poolPromise = null; // Allow retry on next request
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
    
    // Check if the schema is already initialized by looking for the 'users' table
    const tableCheck: any = await connection.execute(
      `SELECT table_name FROM user_tables WHERE table_name = 'USERS'`
    );

    if (tableCheck.rows.length > 0) {
      console.log('Schema already exists. Skipping full initialization.');
      poolInitialized = true;
      return;
    }

    console.log('Initializing full schema...');
    
    // Create tables only if they don't exist
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
        if (!e.message.includes('ORA-00955')) throw e; // Ignore if already exists
      }
    }

    try { await connection.execute(`ALTER TABLE users ADD is_verified NUMBER(1) DEFAULT 0`); } catch(e) {}
    try { await connection.execute(`ALTER TABLE users ADD verification_code VARCHAR2(10)`); } catch(e) {}
    
    // Notifications Table Migration
    try {
      await connection.execute(`
        CREATE TABLE notifications (
          id VARCHAR2(255) PRIMARY KEY,
          user_id VARCHAR2(255),
          family_id VARCHAR2(255),
          type VARCHAR2(50),
          message VARCHAR2(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_read NUMBER(1) DEFAULT 0
        )
      `);
    } catch(e) {}

    console.log('Database tables verified/created');
  } catch (err: any) {
    console.error('CRITICAL: Database Initialization Error:', err.message);
    if (err.message.includes('ORA-12170')) console.error('HINT: Network Timeout. Check Oracle ACL / Firewall.');
    if (err.message.includes('ORA-01017')) console.error('HINT: Invalid Credentials. Check ORACLE_USER and ORACLE_PASSWORD.');
    if (err.message.includes('NJS-040')) console.error('HINT: Connection Pool Timeout. The database might be sleeping or unreachable.');
    poolInitialized = false;
  } finally {
    if (connection) await connection.close();
  }
}

// Initialize Database and Start Server
let poolInitialized = false;
let initializing: Promise<void> | null = null;

app.use('/api', async (req, res, next) => {
  if (!poolInitialized && !req.path.startsWith('/system/setup')) {
    if (!initializing) {
      console.log(`Initial call to DB from: ${req.path}. Starting lazy init...`);
      initializing = initializeDatabase().then(() => {
        poolInitialized = true;
        initializing = null;
      }).catch(err => {
        console.error('Lazy Init Failed:', err);
        initializing = null;
      });
    }
    // Wait for initialization to complete before proceeding
    await initializing;
  }
  next();
});

// Initialize Database and Start Server (Local/Long-lived only)
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

// Serve static files in production
if (NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // Catch-all route for SPA
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

startServer();

export default app;

// Auth Middleware
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

// Registration
app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, role, familyId } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();

    // Secure Household Entry Logic
    if (role === 'USER') {
      if (!familyId) return res.status(400).json({ error: 'Family Estate ID is required to join a household.' });
      
      const checkFid: any = await connection.execute(
        `SELECT COUNT(*) as count FROM users WHERE family_id = :fid`,
        [familyId]
      );
      // checkFid.rows[0].COUNT or similar depending on outFormat
      const count = checkFid.rows[0] ? (checkFid.rows[0][0] || checkFid.rows[0].COUNT) : 0;
      if (count === 0) {
        return res.status(400).json({ error: 'Invalid Family Estate ID. Please check with your household administrator.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    const fId = familyId || (role === 'ADMIN' ? Math.random().toString(36).substring(7).toUpperCase() : '');
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, name, role, family_id, is_verified, verification_code) VALUES (:id, :email, :pass, :name, :role, :fid, 0, :vcode)`,
      [id, email, hashedPassword, fullName, role, fId, verificationCode],
      { autoCommit: true }
    );

    // Send Welcome Email with Verification Code
    try {
      if (process.env.RESEND_API_KEY) {
        await resendClient.emails.send({
          from: `MyAsset Security <${getEmailSender()}>`,
          to: email,
          subject: 'Verify Your MyAsset Account',
          html: `<div style="font-family: sans-serif; padding: 20px;">
                  <h2 style="color: #6200ee;">Welcome to MyAsset, ${fullName}!</h2>
                  <p>Your global asset registry account has been successfully created. Please verify your email to continue.</p>
                  <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
                    <p style="margin-bottom: 10px; font-weight: bold; color: #666;">YOUR VERIFICATION CODE</p>
                    <h1 style="font-size: 3em; letter-spacing: 10px; color: #6200ee; margin: 0;">${verificationCode}</h1>
                  </div>
                  <div style="background: #eee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Registry ID:</strong> <span style="color: #6200ee;">${fId}</span></p>
                    <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
                  </div>
                  <p>Enter this code in the application to activate your account.</p>
                </div>`
        });
        console.log('Verification email sent to:', email);
      }
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr);
    }

    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Operation failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

// Google Auth
app.post('/api/auth/google', async (req, res) => {
  const { token, email, role: requestedRole, familyId: requestedFamilyId } = req.body;
  let connection;
  try {
    // In a real production app, we would verify the Firebase token here.
    // For now, we trust the frontend's verified email and find/create the user.
    const p = await getPool();
    connection = await p.getConnection();
    
    const result: any = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let user = result.rows[0];
    
    if (!user) {
      // Create new user if they don't exist
      const id = Date.now().toString();
      const name = email.split('@')[0];
      const role = requestedRole || 'USER';

      // If joining as a USER, verify familyId
      if (role === 'USER' && requestedFamilyId) {
        const checkFid: any = await connection.execute(
          `SELECT COUNT(*) as count FROM users WHERE family_id = :fid`,
          [requestedFamilyId]
        );
        const count = checkFid.rows[0] ? (checkFid.rows[0][0] || checkFid.rows[0].COUNT) : 0;
        if (count === 0) {
          return res.status(400).json({ error: 'Invalid Family Estate ID. Please check with your household administrator.' });
        }
      }

      const fId = requestedFamilyId || (role === 'ADMIN' ? Math.random().toString(36).substring(7).toUpperCase() : '');
      
      await connection.execute(
        `INSERT INTO users (id, email, name, role, family_id, is_verified) VALUES (:id, :email, :name, :role, :fid, 1)`,
        [id, email, name, role, fId],
        { autoCommit: true }
      );
      
      const newResult: any = await connection.execute(
        `SELECT * FROM users WHERE id = :id`,
        [id],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      user = newResult.rows[0];
    }

    const jwtToken = jwt.sign(
      { userId: user.ID, email: user.EMAIL, role: user.ROLE, familyId: user.FAMILY_ID }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.cookie('token', jwtToken, { httpOnly: true, secure: NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.ID, email: user.EMAIL, fullName: user.NAME, role: user.ROLE, familyId: user.FAMILY_ID } });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Google authentication failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
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
    if (user) {
      if (user.IS_VERIFIED === 0) {
        return res.status(403).json({ error: 'Please verify your email address before logging in.', needsVerification: true, email: user.EMAIL });
      }
      console.log('User found:', user.EMAIL);
      const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
      console.log('Password match:', isMatch);
      
      if (isMatch) {
        const token = jwt.sign({ userId: user.ID, email: user.EMAIL, role: user.ROLE, familyId: user.FAMILY_ID }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
        return res.json({ user: { id: user.ID, email: user.EMAIL, fullName: user.NAME, role: user.ROLE, familyId: user.FAMILY_ID } });
      }
    } else {
      console.log('User not found');
    }
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

// Verify Email
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

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    await connection.execute(
      `UPDATE users SET is_verified = 1, verification_code = NULL WHERE LOWER(email) = LOWER(:email)`,
      { email },
      { autoCommit: true }
    );

    res.json({ success: true, message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    console.error('Verification failed:', err);
    res.status(500).json({ error: 'Verification failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

// Get Profile
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
    
    // Only fetch CLOB if it actually has data
    if (user.PHOTO_LEN && user.PHOTO_LEN > 0) {
      const fullUser: any = await connection.execute(
        `SELECT photo_url FROM users WHERE id = :id`,
        [req.user.userId],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (fullUser.rows[0]?.PHOTO_URL) {
        photoUrl = await fullUser.rows[0].PHOTO_URL.getData();
      }
    }
    
    res.json({ user: { id: user.ID, email: user.EMAIL, fullName: user.NAME, role: user.ROLE, familyId: user.FAMILY_ID, photoUrl } });
  } catch (err) {
    console.error('Me endpoint failed:', err);
    res.status(500).json({ error: 'Fetch failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

// Update Profile
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
    
    // Fetch updated user to return
    const result: any = await connection.execute(
      `SELECT id, email, name, role, family_id, photo_url FROM users WHERE id = :id`,
      [req.user.userId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = result.rows[0];
    let finalPhotoUrl = '';
    if (user.PHOTO_URL) {
      finalPhotoUrl = await user.PHOTO_URL.getData();
    }
    
    // Log Activity
    await createNotification(req.user.userId, req.user.familyId, 'PROFILE_UPDATE', `Updated profile information for ${fullName}`);

    res.json({ user: { id: user.ID, email: user.EMAIL, fullName: user.NAME, role: user.ROLE, familyId: user.FAMILY_ID, photoUrl: finalPhotoUrl } });
  } catch (err) {
    res.status(500).json({ error: 'Update failed.' });
  } finally {
    if (connection) await connection.close();
  }
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
    const result: any = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(:email)`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email address not found in our registry.' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    
    await connection.execute(
      `UPDATE users SET reset_code = :code, reset_expiry = :exp WHERE LOWER(email) = LOWER(:email)`,
      { code: resetCode, exp: expiry, email },
      { autoCommit: true }
    );

    // Send Email via Resend
    try {
      if (process.env.RESEND_API_KEY) {
        await resendClient.emails.send({
          from: `MyAsset Security <${getEmailSender()}>`,
          to: email,
          subject: 'Security Code: Password Reset Request',
          html: `<div style="font-family: sans-serif; padding: 20px;">
                  <h2>Verification Code</h2>
                  <p>A password reset was requested for your MyAsset account.</p>
                  <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 2em; letter-spacing: 5px; font-weight: bold; color: #6200ee;">${resetCode}</span>
                  </div>
                  <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                    This code will expire in 1 hour. If you did not request this, please ignore this email.
                  </p>
                </div>`
        });
        console.log('Reset code sent to:', email);
        res.json({ success: true, message: 'Verification code sent to your email.' });
      } else {
        console.warn('RESEND_API_KEY not configured. Logging reset code to console:');
        console.log(`[SECURITY INFO] Reset Code for ${email}: ${resetCode}`);
        res.json({ 
          success: true, 
          message: 'Verification code generated.', 
          needsSetup: true
        });
      }
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      res.json({ 
        success: true, 
        message: 'Verification code generated but email failed. System Administrator must check server logs.', 
        needsSetup: true 
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Reset request failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

app.post('/api/system/setup', async (req, res) => {
  const { apiKey, sender } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key required' });

  try {
    const envPath = path.join(process.cwd(), '.env');
    
    // Update live env
    process.env.RESEND_API_KEY = apiKey;
    if (sender) process.env.EMAIL_SENDER = sender;
    
    // Refresh Resend client
    resendClient = new Resend(apiKey);
    
    res.json({ message: 'Resend infrastructure active.' });

    let envContent = '';
    try {
      envContent = await fs.promises.readFile(envPath, 'utf8');
    } catch (e) {
      // .env might not exist yet
    }

    const lines = envContent.split('\n');
    const newLines = lines.filter(line => !line.startsWith('RESEND_API_KEY=') && !line.startsWith('EMAIL_SENDER='));
    newLines.push(`RESEND_API_KEY="${apiKey}"`);
    if (sender) newLines.push(`EMAIL_SENDER="${sender}"`);
    
    await fs.promises.writeFile(envPath, newLines.join('\n').trim() + '\n');
    console.log('SYSTEM: .env updated via UI. Refreshing configuration...');
    
    res.json({ success: true, message: 'System credentials saved to .env and active!' });
  } catch (err) {
    console.error('Setup failed:', err);
    res.status(500).json({ error: 'Could not write to .env' });
  }
});

app.post('/api/auth/confirm-reset', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Details missing' });

  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(:email) AND reset_code = :code AND reset_expiry > CURRENT_TIMESTAMP`,
      { email, code },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.execute(
      `UPDATE users SET password_hash = :pass, reset_code = NULL, reset_expiry = NULL WHERE LOWER(email) = LOWER(:email)`,
      { pass: hashedPassword, email },
      { autoCommit: true }
    );

    res.json({ success: true, message: 'Your password has been updated. You can now login.' });
  } catch (err) {
    console.error('Confirm reset failed:', err);
    res.status(500).json({ error: 'Update failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

// Assets Endpoints
app.get('/api/assets/land', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result = await connection.execute(`SELECT * FROM land_assets WHERE family_id = :fid`, [req.user.familyId || ''], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: 'Fetch failed.' }); } finally { if (connection) await connection.close(); }
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
      {
        id, upi: asset.upi, title: asset.title, address: asset.address, zoning: asset.zoning, 
        master_plan: asset.masterPlan, sz: asset.size, pd: asset.purchaseDate, ed: asset.expiryDate,
        status: asset.status, val: asset.valuation, lat: asset.location.lat, lng: asset.location.lng, fid: req.user.familyId || ''
      },
      { autoCommit: true }
    );

    await createNotification(req.user.userId, req.user.familyId, 'ASSET_CREATED', `Added new Land Asset: ${asset.title} (UPI: ${asset.upi})`);

    res.json({ id, ...asset });
  } catch (err: any) { res.status(500).json({ error: 'Asset creation failed.' }); } finally { if (connection) await connection.close(); }
});

app.put('/api/assets/land/:id', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const asset = req.body;
    await connection.execute(
      `UPDATE land_assets SET 
       upi = :upi, title = :title, address = :address, zoning = :zoning, 
       master_plan = :master_plan, size_ha = :sz, purchase_date = :pd, 
       expiry_date = :ed, status = :status, valuation = :val, 
       lat = :lat, lng = :lng 
       WHERE id = :id AND family_id = :fid`,
      {
        id: req.params.id, upi: asset.upi, title: asset.title, address: asset.address, zoning: asset.zoning, 
        master_plan: asset.masterPlan, sz: asset.size, pd: asset.purchaseDate, ed: asset.expiryDate,
        status: asset.status, val: asset.valuation, lat: asset.location.lat, lng: asset.location.lng, 
        fid: req.user.familyId || ''
      },
      { autoCommit: true }
    );

    await createNotification(req.user.userId, req.user.familyId, 'ASSET_UPDATED', `Updated Land Asset: ${asset.title}`);

    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Update failed.' }); } finally { if (connection) await connection.close(); }
});

app.delete('/api/assets/land/:id', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    await connection.execute(`DELETE FROM land_assets WHERE id = :id AND family_id = :fid`, { id: req.params.id, fid: req.user.familyId || '' }, { autoCommit: true });
    
    await createNotification(req.user.userId, req.user.familyId, 'ASSET_DELETED', `Removed a land asset from the registry`);

    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Deletion failed.' }); } finally { if (connection) await connection.close(); }
});

app.get('/api/assets/residential', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result = await connection.execute(`SELECT * FROM residential_assets WHERE family_id = :fid`, [req.user.familyId || ''], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: 'Fetch failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/assets/residential', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const asset = req.body;
    const id = Date.now().toString();
    await connection.execute(
      `INSERT INTO residential_assets (id, name, location, status, tenant, lease_start, lease_end, monthly_rent, valuation, appreciation, img_url, family_id, linked_upi)
       VALUES (:id, :name, :loc, :status, :tenant, :ls, :le, :rent, :val, :app, :img, :fid, :lupi)`,
      { 
        id, name: asset.name, loc: asset.location, status: asset.status, tenant: asset.tenant, 
        ls: asset.leaseStart, le: asset.leaseEnd, rent: asset.monthlyRent, val: asset.valuation, app: asset.appreciation, 
        img: { val: asset.img || '', type: oracledb.DB_TYPE_CLOB }, 
        fid: req.user.familyId || '',
        lupi: asset.linkedUPI || ''
      },
      { autoCommit: true }
    );

    await createNotification(req.user.userId, req.user.familyId, 'ASSET_CREATED', `Added new Residential Property: ${asset.name}`);

    res.json({ id, ...asset });
  } catch (err: any) { res.status(500).json({ error: 'Asset creation failed.' }); } finally { if (connection) await connection.close(); }
});

app.put('/api/assets/residential/:id', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const asset = req.body;
    await connection.execute(
      `UPDATE residential_assets SET 
       name = :name, location = :loc, status = :status, tenant = :tenant,
       lease_start = :ls, lease_end = :le, monthly_rent = :rent, valuation = :val,
       appreciation = :app, img_url = :img, linked_upi = :lupi
       WHERE id = :id AND family_id = :fid`,
      { 
        id: req.params.id, name: asset.name, loc: asset.location, status: asset.status, 
        tenant: asset.tenant, ls: asset.leaseStart, le: asset.leaseEnd, 
        rent: asset.monthlyRent, val: asset.valuation, app: asset.appreciation, 
        img: { val: asset.img || '', type: oracledb.DB_TYPE_CLOB },
        fid: req.user.familyId || '',
        lupi: asset.linkedUPI || ''
      },
      { autoCommit: true }
    );

    await createNotification(req.user.userId, req.user.familyId, 'ASSET_UPDATED', `Updated Property Details: ${asset.name}`);

    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Update failed.' }); } finally { if (connection) await connection.close(); }
});

app.delete('/api/assets/residential/:id', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    await connection.execute(`DELETE FROM residential_assets WHERE id = :id AND family_id = :fid`, { id: req.params.id, fid: req.user.familyId || '' }, { autoCommit: true });
    
    await createNotification(req.user.userId, req.user.familyId, 'ASSET_DELETED', `Removed a residential property from the registry`);

    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Deletion failed.' }); } finally { if (connection) await connection.close(); }
});

app.get('/api/assets/vehicles', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result = await connection.execute(`SELECT * FROM vehicles WHERE family_id = :fid`, [req.user.familyId || ''], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: 'Fetch failed.' }); } finally { if (connection) await connection.close(); }
});

app.post('/api/assets/vehicles', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const v = req.body;
    const id = Date.now().toString();
    await connection.execute(
      `INSERT INTO vehicles (id, model, reg, insurance_expiry, status, owner, location, last_service, img_url, family_id)
       VALUES (:id, :model, :reg, :ie, :status, :owner, :loc, :ls, :img, :fid)`,
      { 
        id, model: v.model, reg: v.reg, ie: v.insuranceExpiry, status: v.status, owner: v.owner, 
        loc: v.location, ls: v.lastService, 
        img: { val: v.img || '', type: oracledb.DB_TYPE_CLOB }, 
        fid: req.user.familyId || '' 
      },
      { autoCommit: true }
    );

    await createNotification(req.user.userId, req.user.familyId, 'ASSET_CREATED', `Registered new Vehicle: ${v.model} (${v.reg})`);

    res.json({ id, ...v });
  } catch (err: any) { res.status(500).json({ error: 'Vehicle creation failed.' }); } finally { if (connection) await connection.close(); }
});

app.delete('/api/assets/vehicles/:id', authenticateToken, authorizeAdmin, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    await connection.execute(`DELETE FROM vehicles WHERE id = :id AND family_id = :fid`, { id: req.params.id, fid: req.user.familyId || '' }, { autoCommit: true });
    
    await createNotification(req.user.userId, req.user.familyId, 'ASSET_DELETED', `Removed a vehicle from the active fleet`);

    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Deletion failed.' }); } finally { if (connection) await connection.close(); }
});

app.get('/api/family/members', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT id, email, name, role, family_id, photo_url FROM users WHERE family_id = :fid`,
      [req.user.familyId || ''],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const members = await Promise.all(result.rows.map(async (row: any) => {
      let photoUrl = '';
      if (row.PHOTO_URL) {
        photoUrl = await row.PHOTO_URL.getData();
      }
      return {
        id: row.ID,
        email: row.EMAIL,
        name: row.NAME,
        role: row.ROLE,
        familyId: row.FAMILY_ID,
        photoUrl,
        status: 'ACTIVE'
      };
    }));
    
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

app.post('/api/family/members', authenticateToken, authorizeAdmin, async (req: any, res) => {
  const { email, password, fullName, role } = req.body;
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    const familyId = req.user.familyId;
    
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, name, role, family_id) VALUES (:id, :email, :pass, :name, :role, :fid)`,
      [id, email, hashedPassword, fullName, role, familyId],
      { autoCommit: true }
    );

    await createNotification(req.user.userId, req.user.familyId, 'USER_ADDED', `Added new family member: ${fullName}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member.' });
  } finally {
    if (connection) await connection.close();
  }
});// Notifications API
app.get('/api/notifications', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    const result: any = await connection.execute(
      `SELECT n.*, u.name as user_name 
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       WHERE n.family_id = :fid
       ORDER BY n.created_at DESC`,
      [req.user.familyId || ''],
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 50 }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

app.post('/api/notifications/read', authenticateToken, async (req: any, res) => {
  let connection;
  try {
    const p = await getPool();
    connection = await p.getConnection();
    await connection.execute(
      `UPDATE notifications SET is_read = 1 WHERE family_id = :fid`,
      [req.user.familyId || ''],
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed.' });
  } finally {
    if (connection) await connection.close();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
