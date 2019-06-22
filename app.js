const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const { Pool, Client } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

const app = express();
const PORT = process.env.PORT || 5000;
//const router = express.Router();

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

const verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    } else {
        res.sendStatus(403);
    }
    if (token) {
        jwt.verify(token, 'keepitsecret', (err, token) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Token is not valid'
                });
            } else {
                req.token = token;
                next();
            }
        });
    } else {
        // res.sendStatus(403);
        return res.json({
            success: false,
            message: 'Token is not provided'
        });
    }
};

app.get('/', async (req, res) => {
    res.sendFile('index.html');
});

app.get('/bank', verifyToken, async (req, res) => {
    let { ifsc } = req.query;
    const { rows } = await pool.query(
        'SELECT banks.name, branches.ifsc, branches.bank_id, branches.branch, branches.address, branches.city, branches.district, branches.state FROM branches JOIN banks ON (branches.bank_id = banks.id) WHERE branches.ifsc = $1',
        [ifsc]
    );
    res.send(rows[0]);
    // res.json(rows[0]);
});

app.get('/branches', verifyToken, async (req, res) => {
    let { limit, offset, bank, city } = req.query;
    limit = parseInt(limit);
    offset = parseInt(offset);
    if (isNaN(limit) || !limit || limit <= 0) {
        limit = 30;
    }
    if (isNaN(offset) || !offset || offset < 0) {
        offset = 0;
    }
    const { rows } = await pool.query(
        'SELECT banks.name, branches.ifsc, branches.bank_id, branches.branch, branches.address, branches.city, branches.district, branches.state FROM branches JOIN banks ON (branches.bank_id = banks.id) WHERE banks.name = $1 AND branches.city = $2 LIMIT $3 OFFSET $4',
        [bank, city, limit, offset]
    );
    res.send(rows);
});

app.post('/login', async (req, res) => {
    const user = {
        username: 'admin'
    };
    jwt.sign(
        { user },
        'keepitsecret',
        { expiresIn: '432000s' },
        (err, token) => {
            res.json({
                token
            });
        }
    );
});

app.listen(PORT, console.log(`Server is running on ${PORT}`));
