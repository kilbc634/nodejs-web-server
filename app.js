var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var session = require('express-session');
var io = require('socket.io')
var redis = require('redis');
var moment = require('moment');
var tz = require('moment-timezone');
moment.tz.setDefault("Asia/Taipei");
var md5 = require("md5");
const setting = require('./setting');

// --------------------- Redis init

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

// --------------------- Session init

var sessionMiddleware = session({
    secret: 'tsukumonotsuki', // change this!
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge : 1000 * 60 * 60 * 12, // unit is 'ms'
    }
});

// --------------------- Express init

var app = express();
var server = http.createServer(app);  // use for socket.io
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/static'));
app.use(sessionMiddleware);

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
            req.session.room = account;
            res.json({
                status: 'OK',
                msg: 'Login success'
            });
        });
    })
});

app.get('/logout(.html)?', function (req, res) {
    req.session.destroy((err) => {
        // req.session.loginUser = null;
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

app.get('/get_chatMessages', function (req, res) {
    if (!req.session.loginUser) {
        res.status(403).send('Permission denied');
        return;
    }
    var begin = parseInt(req.query['begin']) || 0;
    var amount = parseInt(req.query['amount']) || 20;
    var key = 'chatQueue/' + req.session.room;
    RedisClient.lrange(key, begin, begin + amount - 1, (err, result) => {
        if (result.length > 0) {
            var msgs = [];
            for (var string of result) {
                var msg = JSON.parse(string);
                msgs.push(msg);
            }
            res.json({
                chatMessages: msgs
            })
        } else {
            res.json({
                chatMessages: []
            })
        }
    });
});

// --------------------- Socket.io init

var socketApp = io(server);
socketApp.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

socketApp.on('connection', (socket) => {
    var session = socket.request.session;
    if (session.loginUser) {
        var loginUser = session.loginUser;
        var room = session.room;
        socket.nickname = loginUser;
        socket.join(room);
        console.log(`[INFO] User - ${loginUser} enter the room - ${room}`)
    } else {
        console.log(`[INFO] Socket connect fail`);
        return;
    }

    socket.on('sendMessage', (data) => {
        var msg = data['msg'];
        var key = 'chatQueue/' + room;
        var ts = parseInt(moment().format("X"));
        var setValue = {
            timestamp: ts,
            user: loginUser,
            text: msg
        }
        RedisClient.lpush(key, JSON.stringify(setValue));
        socketApp.to(room).emit('newMessage', {
            timestamp: ts,
            msg: msg
        });
    });

    socket.on('test', (data) => {
        console.log(`[INFO] From ${loginUser}: ${JSON.stringify(data)}`);
    });
    
});


var server = server.listen(setting.WEB_PORT, function () {
    console.log('Node server is running..');
});