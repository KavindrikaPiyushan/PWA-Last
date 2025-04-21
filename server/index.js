const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// DB Connection using promise-based approach
const createDbConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'testdb',
    });
    console.log('MySQL Connected...');
    return connection;
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

// Initialize DB connection
let db;
(async () => {
  db = await createDbConnection();
})();

// Helpers
const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Middleware to verify access token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 📝 REGISTER
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    
    // Start a transaction to ensure data consistency
    await db.beginTransaction();
    
    // First, create a user entry
    const [userResult] = await db.execute(
      'INSERT INTO users (email) VALUES (?)',
      [email]
    );
    
    const userId = userResult.insertId;
    
    // Then create the auth entry with the same ID
    await db.execute(
      'INSERT INTO auth (id, email, password) VALUES (?, ?, ?)',
      [userId, email, hashed]
    );
    
    // Commit the transaction
    await db.commit();
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      id: userId,
      email
    });
  } catch (err) {
    // Rollback on error
    await db.rollback();
    console.error('Registration error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Database error occurred'
    });
  }
});

// 🔑 LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Get user from auth table
    const [authResults] = await db.execute('SELECT * FROM auth WHERE email = ?', [email]);
    
    if (authResults.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const user = authResults[0];
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      sameSite: 'strict',
      path: '/refresh'
    });

    try {
      // Check if user exists in users table
      const [userCheck] = await db.execute('SELECT id FROM users WHERE id = ?', [user.id]);
      
      // If not, create a matching record
      if (userCheck.length === 0) {
        await db.execute(
          'INSERT INTO users (id, email) VALUES (?, ?)',
          [user.id, user.email]
        );
      }
      
      // Check if user already has an audit entry
      const [auditCheck] = await db.execute(
        'SELECT id FROM user_login_audit WHERE user_id = ?',
        [user.id]
      );
      
      const ip = req.ip;
      const userAgent = req.headers['user-agent'];
      
      let auditId;
      
      if (auditCheck.length > 0) {
        // Update existing audit entry
        await db.execute(
          'UPDATE user_login_audit SET login_time = CURRENT_TIMESTAMP, ip_address = ?, user_agent = ? WHERE user_id = ?',
          [ip, userAgent, user.id]
        );
        auditId = auditCheck[0].id;
      } else {
        // Create a new audit entry
        const [insertResult] = await db.execute(
          'INSERT INTO user_login_audit (user_id, ip_address, user_agent) VALUES (?, ?, ?)',
          [user.id, ip, userAgent]
        );
        auditId = insertResult.insertId;
      }

      // Get the login time
      const [rows] = await db.execute(
        'SELECT login_time FROM user_login_audit WHERE id = ?',
        [auditId]
      );

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        accessToken,
        serverTimestamp: new Date(rows[0].login_time).getTime(),
      });
    } catch (logErr) {
      // If logging fails, we still want the login to succeed
      console.error('Login audit error:', logErr);
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        accessToken,
        serverTimestamp: Date.now(),
      });
    }
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Server error occurred'
    });
  }
});

// 🔄 REFRESH TOKEN
app.post('/refresh', (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ status: 'error', message: 'No refresh token found' });

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ status: 'error', message: 'Invalid or expired refresh token' });

    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    res.status(200).json({ status: 'success', message: 'Access token refreshed successfully', accessToken });
  });
});

// Verify Session

app.get('/verify-session',verifyToken,async(req,res)=>{
    const userId = req.user.id;

    const [rows] = await db.execute(
      'SELECT login_time FROM user_login_audit WHERE user_id= ? ORDER BY login_time DESC LIMIT 1',
      [userId]
    );

    if(rows.length ===0){
      return res.status(404).json({message:'No login record found'});

    }

    res.json({
      serverTimestamp:new Date(rows[0].login_time.getTime())
    });

});

// 🚪 LOGOUT
app.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { path: '/refresh' });
  res.status(204).json({ status: 'success', message: 'User logged out successfully' });
});

// ✅ Protected Routes
app.get('/users', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, email FROM users');
    res.status(200).json({
      status: 'success',
      message: 'Users retrieved successfully',
      users: rows
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users'
    });
  }
});

app.get('/users/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'User retrieved successfully',
      user: rows[0]
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user'
    });
  }
});

app.post('/users', verifyToken, async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      id: result.insertId,
      name,
      email
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error creating user'
    });
  }
});

app.put('/users/:id', verifyToken, async (req, res) => {
  const { name, email } = req.body;
  try {
    await db.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, req.params.id]
    );
    
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      id: req.params.id,
      name,
      email
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user'
    });
  }
});

app.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});