'use strict';

var http = require('http');
var express = require('express');
var open = require('open');

var socket = require('./socket');
var api = require('./routes/api');

var port = 3000;

var app = express();

app.use('/api', api);
app.use(express.static(__dirname + '/../client'));

var server = http.Server(app);
socket(server);
server.listen(port, function() {
	console.log('HTTP server listening on port ' + port);

	open('http://localhost:' + port + '/');
});
