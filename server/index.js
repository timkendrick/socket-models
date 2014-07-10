'use strict';

var http = require('http');
var express = require('express');

var api = require('./api');
var socket = require('./socket');
var quoteService = require('./services/quote');

var port = 3000;

var app = express();

var dataService = {
	quote: quoteService
};

app.use('/api', api(dataService));
app.use(express.static(__dirname + '/../client'));

var server = http.Server(app);
socket(server, dataService);
server.listen(port, function() {
	console.log('HTTP server listening on port ' + port);
});
