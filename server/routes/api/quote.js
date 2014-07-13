'use strict';

var express = require('express');

var QuoteService = require('../../services/QuoteService');

module.exports = (function() {

	var app = express();

	app.get('/featured', function(req, res, next) {
		var item = QuoteService.getFeatured();
		res.json(item);
	});

	app.get('/:id', function(req, res, next) {
		var itemId = Number(req.params.id);
		var item = QuoteService.retrieve(itemId) || QuoteService.create(itemId);
		res.json(item);
	});

	return app;
})();
