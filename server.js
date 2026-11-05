// Notes Central — authentication and library API.
//   POST /signup, POST /login         account access (used by login.html)
//   GET  /me                          current user (Bearer token)
//   GET  /library, PUT /library       bookmarks, history and favourite subjects
//                                     synced for signed-in users (js/library.js)
// Configuration comes from environment variables or a local .env file
// (copy .env.example to .env). Never commit real credentials.
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');

// Load .env when present (built into Node 20.12+, no extra dependency).
try {
    process.loadEnvFile();
} catch {
    // No .env file — rely on real environment variables.
}

const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set; using a temporary secret (tokens reset on restart).');
}

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '32kb' }));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'Notes_db',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'UserAuth',
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected...');
    // Additive table for synced libraries; existing tables are untouched.
    db.query(
        `CREATE TABLE IF NOT EXISTS UserLibrary (
            user_id INT PRIMARY KEY,
            data JSON NOT NULL,
            updated_at BIGINT NOT NULL
        )`,
        (tableErr) => tableErr && console.error('Could not create UserLibrary table:', tableErr.message)
    );
});

const serverError = (res, err) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
};

// Route for signup
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please fill in your username, email and password.' });
    }
    if (typeof username !== 'string' || !/^[A-Za-z0-9]{1,50}$/.test(username)) {
        return res.status(400).json({ message: 'Your username can only contain letters and numbers.' });
    }
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length > 200) {
        return res.status(400).json({ message: 'Please choose a password of up to 200 characters.' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return serverError(res, err);

        const sql = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hash], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'User already exists' });
                }
                return serverError(res, err);
            }
            res.status(200).json({ message: 'User registered successfully' });
        });
    });
});

// Route for login
app.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Please enter your email and password.' });
    }

    const sql = 'SELECT * FROM Users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return serverError(res, err);
        if (results.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return serverError(res, err);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect password' });
            }

            // Generate a token
            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({
                message: 'Login successful',
                token,
                user: { id: user.id, username: user.username, email: user.email },
            });
        });
    });
});

// Verifies "Authorization: Bearer <token>" and sets req.userId
function requireAuth(req, res, next) {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Please sign in.' });
    }
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err || !payload || payload.id === undefined) {
            return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
        }
        req.userId = payload.id;
        next();
    });
}

// Current user
app.get('/me', requireAuth, (req, res) => {
    db.query('SELECT id, username, email FROM Users WHERE id = ?', [req.userId], (err, results) => {
        if (err) return serverError(res, err);
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(results[0]);
    });
});

// Validates and normalises a library payload; returns null if invalid
const ID_PATTERN = /^[a-z0-9-]{1,80}$/;
function cleanLibrary(body) {
    if (!body || typeof body !== 'object') return null;
    const entries = (list, max) => {
        if (!Array.isArray(list) || list.length > max) return null;
        const out = [];
        for (const e of list) {
            if (!e || typeof e.id !== 'string' || !ID_PATTERN.test(e.id) || !Number.isFinite(e.at)) return null;
            out.push({ id: e.id, at: Math.trunc(e.at) });
        }
        return out;
    };
    const bookmarks = entries(body.bookmarks, 500);
    const recent = entries(body.recent, 50);
    const favourites = Array.isArray(body.favourites) && body.favourites.length <= 100
        && body.favourites.every((f) => typeof f === 'string' && ID_PATTERN.test(f)) ? body.favourites : null;
    const updatedAt = Number.isFinite(body.updatedAt) ? Math.trunc(body.updatedAt) : null;
    if (!bookmarks || !recent || !favourites || updatedAt === null) return null;
    return { bookmarks, recent, favourites, updatedAt };
}

// Read the signed-in user's library
app.get('/library', requireAuth, (req, res) => {
    db.query('SELECT data FROM UserLibrary WHERE user_id = ?', [req.userId], (err, results) => {
        if (err) return serverError(res, err);
        if (results.length === 0) {
            return res.json({ bookmarks: [], recent: [], favourites: [], updatedAt: 0 });
        }
        const data = typeof results[0].data === 'string' ? JSON.parse(results[0].data) : results[0].data;
        res.json(data);
    });
});

// Replace the signed-in user's library
app.put('/library', requireAuth, (req, res) => {
    const library = cleanLibrary(req.body);
    if (!library) return res.status(400).json({ message: 'Invalid library data.' });
    const sql = `INSERT INTO UserLibrary (user_id, data, updated_at) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)`;
    db.query(sql, [req.userId, JSON.stringify(library), library.updatedAt], (err) => {
        if (err) return serverError(res, err);
        res.json({ message: 'Library saved', updatedAt: library.updatedAt });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
