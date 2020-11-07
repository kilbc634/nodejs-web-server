var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var redis = require('redis');
var md5 = require("md5");
const setting = require('./setting');

var RedisClient = redis.createClient({
    host: setting.REDIS_HOST,
    port: setting.REDIS_PORT,
    password: setting.REDIS_AUTH
});
RedisClient.on('connect', function() {
    console.log('Redis client connected');
});
RedisClient.on('error', function(error) {
    console.error(error);
});

var app = express();
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static'));
app.use(session({
    secret: 'tsukumonotsuki', // change this!
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge : 1000 * 60 * 60 * 12, // unit is 'ms'
    }
}));

app.get('/', function (req, res) {
    res.redirect('/index');
});

app.get('/index(.html)?', function (req, res) {
    if (req.session.loginUser) {
        res.sendFile(__dirname + '/index.html'); 
    } else {
        res.redirect('/login');
    }
});

app.get('/login(.html)?', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', function (req, res) {
    var account = req.body['account'];
    var key = 'account/' + account;
    var password = md5(req.body['password']);
    RedisClient.get(key, (err, result) => {
        if (result === null) {
            res.json({
                status: 'ERROR',
                msg: 'This account not exists'
            });
            return;
        }
        var accountData = JSON.parse(result);
        if (password != accountData['password']) {
            res.json({
                status: 'ERROR',
                msg: 'Wrong password'
            });
            return;
        }
        req.session.regenerate((err) => {
            req.session.loginUser = account;
            res.json({
                status: 'OK',
                msg: 'Login success'
            });
        });
    })
});

app.get('/logout(.html)?', function (req, res) {
    req.session.destroy((err) => {
        //req.session.loginUser = null;
    });
    res.redirect('login');
})

app.get('/signup(.html)?', function (req, res) {
    res.sendFile(__dirname + '/signup.html');
});

app.post('/signup', function (req, res) {
    var account = req.body['account'];
    var key = 'account/' + account;
    var setValue = {
        password: md5(req.body['password']),
        nick: req.body['nick']
    }
    RedisClient.get(key, (err, result) => {
        if (result === null) {
            RedisClient.set(key, JSON.stringify(setValue), (err) => {
                res.json({
                    status: 'OK',
                    msg: 'Sign up complated'
                });
            });
        } else {
                res.json({
                    status: 'ERROR',
                    msg: 'This account is exists'
                });
        }
    });
});


var server = app.listen(setting.WEB_PORT, function () {
    console.log('Node server is running..');
});