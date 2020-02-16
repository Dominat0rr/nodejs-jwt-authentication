require('dotenv').config();
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json());

const users = [];
let refreshTokens = [];

/* Routes */
app.get('/users', (req, res) => {
    res.json(users);
});

// Add user
app.post('/users', async (req, res) => {
    try {
        // const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, /*salt*/ 10);
        // console.log(salt, hashedPassword);
        const user = { name: req.body.username, password: hashedPassword };
        users.push(user);
        res.status(201).send();
        console.log(user);
    } catch (error) {
        res.status(500).send();
    }
});

// Get token
app.post('/token', (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) {
        return res.sendStatus(401);
    }
    if (!refreshTokens.includes(refreshToken)) {
        return res.sendStatus(403);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, user) => {
        if (error ) {
            return res.sendStatus(403);
        }
        const accessToken = generateAccessToken({ name: user.name });
        res.json({ accessToken: accessToken });
    });
});

// Delete token / logout user
app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204);
})

// Login user
app.post('/login', async (req, res) => {
    // Authenticate User
    const user = users.find(user => user.name = req.body.username);

    if (user === null) {
        return res.status(400).send('Cannot find user');
    }

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const username = req.body.username;
            const user = { name: username };
            const accessToken = generateAccessToken(user);
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
            refreshTokens.push(refreshToken);
            res.json({ accessToken: accessToken, refreshToken: refreshToken });
            //res.send('Success');
        } else {
            res.send('Not Allowed');
        }
    } catch(e) {
        res.status(500).send(e);
    }
});

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' });
}

app.listen(4000);


/*
get random bytes (for token)
-> require('crypto').randomBytes(64).toString('hex');
*/