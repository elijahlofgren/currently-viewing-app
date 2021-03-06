var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var visitorService = require('./app/services/visitorService');


// Load DB Config file
var db = require('./config/db');
// Prevent mpromise (mongoose's default promise library) is deprecated warning
mongoose.Promise = global.Promise;
// Connect to MongoDB
mongoose.connect(db.url);

// Delete any old records of current users
visitorService.deleteAll();

app.use(express.static('public'));

// Configure routes
require('./app/routes')(app);

// Real-time event handlers
io.on('connection', function (socket) {
    socket.broadcast.emit('new_user_connected');
    console.log('a user connected');
    // Getting socket.io client ip as per http://stackoverflow.com/a/38458477/908677
    var clientIpAddress = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
    visitorService.addVisitor(clientIpAddress);
    socket.on('disconnect', function () {
        console.log('user disconnected');
        var clientIpAddress = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
        visitorService.deleteVisitor(clientIpAddress);
        socket.broadcast.emit('user_left');
    });
});

// Explicitly listen on 0.0.0.0 so that when 
// running from localhost we get 127.0.0.1 as the IP.
http.listen(3000, '0.0.0.0', function () {
    console.log('currently-viewing-app listening on port 3000!');
});
