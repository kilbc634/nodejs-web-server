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
    res.sendFile(__dirname + '/index.html'); 
});

app.get('/login(.html)?', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', function (req, res) {
    // var name = req.body.firstName + ' ' + req.body.lastName;
    // res.send(name + ' Submitted Successfully!');
});

app.get('/signup(.html)?', function (req, res) {
    res.sendFile(__dirname + '/signup.html');
});

app.post('/signup', function (req, res) {
    var account = req.body['account'];
    var key = 'account/' + account;
    var value = {
        password: md5(req.body['password']),
        nick: req.body['nick']
    }
    RedisClient.get(key, (error, result) => {
        console.log(result);
        if (result === null) {
            if (error) {console.error(error);}
            console.log('will sign up for ' + account);
            RedisClient.set(key, JSON.stringify(value), (error) => {
                if (error) {console.error(error);}
                res.json({
                    status: 'OK',
                    msg: 'Sign up complated'
                });
            })
        } else {
                console.log('failed to sign up for ' + account);
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