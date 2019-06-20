const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const { Pool, Client } = require('pg');

const pool = new Pool({
    user: 'itqlzdtgrfjyau',
    host:
        process.env.DATABASE_URL ||
        'ec2-174-129-242-183.compute-1.amazonaws.com',
    database: 'd6p33ck7eeltih',
    password:
        '7d8078433fcfc87a1920056d6f30295ab606715939ad1aeb908489088fdbefbc',
    port: 5432
});

const app = express();
const PORT = process.env.PORT || 5000;
//const router = express.Router();

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

const verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    } else {
        res.sendStatus(403);
    }
    if (token) {
        jwt.verify(token, 'secretkey', (err, token) => {
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
        res.sendStatus(403);
        // return res.json({
        //     success: false,
        //     message: 'Authorization token is not provided'
        // });
    }
};

app.get('/', async (req, res) => {
    res.send('Hello!');
});

app.get('/bank/:ifsc', verifyToken, async (req, res) => {
    const ifsc = req.params.ifsc;
    const { rows } = await pool.query(
        'SELECT banks.name, branches.ifsc, branches.bank_id, branches.branch, branches.address, branches.city, branches.district, branches.state FROM branches JOIN banks ON (branches.bank_id = banks.id) WHERE branches.ifsc = $1',
        [ifsc]
    );
    res.send(rows[0]);
    // res.json(rows[0]);
});
app.get('/bank1/:ifsc', async (req, res) => {
    const ifsc = req.params.ifsc;
    const { rows } = await pool.query(
        'SELECT banks.name, branches.ifsc, branches.bank_id, branches.branch, branches.address, branches.city, branches.district, branches.state FROM branches JOIN banks ON (branches.bank_id = banks.id) WHERE branches.ifsc = $1',
        [ifsc]
    );
    res.send(rows[0]);
    // res.json(rows[0]);
});
app.get('/branches/:bank/:city', verifyToken, async (req, res) => {
    const { bank, city } = req.params;
    let { limit, offset } = req.query;
    limit = parseInt(limit);
    offset = parseInt(offset);
    if (isNaN(limit) || !limit || limit <= 0 || limit > 30) {
        limit = 30;
    }
    if (isNaN(offset) || !offset || offset < 0 || offset > 30) {
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
    jwt.sign({ user }, 'secretkey', { expiresIn: '432000s' }, (err, token) => {
        res.json({
            token
        });
    });
});

app.listen(PORT, console.log(`Server is running on ${PORT}`));
