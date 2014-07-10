'use strict';

var express = require('express');

var quote = require('./api/quote');

module.exports = (function() {

	var app = express();

	app.use('/quote', quote);

	return app;
})();
