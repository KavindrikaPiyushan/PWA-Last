const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // frontend origin
  credentials: true, // allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'testdb',
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

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
  const hashed = await bcrypt.hash(password, 10);
  db.query('INSERT INTO auth (email, password) VALUES (?, ?)', [email, hashed], (err, result) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Database error occurred' });
    res.status(201).json({ status: 'success', message: 'User registered successfully', id: result.insertId, email });
  });
});

// 🔑 LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM auth WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ status: 'error', message: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ status: 'error', message: 'Invalid credentials' });

    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      sameSite: 'strict',
      path: '/refresh'
    });

    res.status(200).json({ status: 'success', message: 'Login successful', accessToken });
  });
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

// 🚪 LOGOUT
app.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { path: '/refresh' });
  res.status(204).json({ status: 'success', message: 'User logged out successfully' });
});

// ✅ Protected Routes
app.get('/users', verifyToken, (req, res) => {
  db.query('SELECT id, name, email FROM users', (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Error fetching users' });
    res.status(200).json({ status: 'success', message: 'Users retrieved successfully', users: rows });
  });
});

app.get('/users/:id', verifyToken, (req, res) => {
  db.query('SELECT id, name, email FROM users WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Error fetching user' });
    res.status(200).json({ status: 'success', message: 'User retrieved successfully', user: rows[0] });
  });
});

app.post('/users', verifyToken, (req, res) => {
  const { name, email } = req.body;
  db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (err, result) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Error creating user' });
    res.status(201).json({ status: 'success', message: 'User created successfully', id: result.insertId, name, email });
  });
});

app.put('/users/:id', verifyToken, (req, res) => {
  const { name, email } = req.body;
  db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Error updating user' });
    res.status(200).json({ status: 'success', message: 'User updated successfully', id: req.params.id, name, email });
  });
});

app.delete('/users/:id', verifyToken, (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Error deleting user' });
    res.status(200).json({ status: 'success', message: 'User deleted successfully' });
  });
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
