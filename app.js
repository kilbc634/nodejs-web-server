var express = require('express');
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html'); 
});

app.get('/login(.html)?', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', function (req, res) {
    var name = req.body.firstName + ' ' + req.body.lastName;
    res.send(name + ' Submitted Successfully!');
});

app.get('/signup(.html)?', function (req, res) {
    res.sendFile(__dirname + '/signup.html');
});

app.post('/signup', function (req, res) {
    var name = req.body.firstName + ' ' + req.body.lastName;
    res.send(name + ' Submitted Successfully!');
});


var server = app.listen(5000, function () {
    console.log('Node server is running..');
});