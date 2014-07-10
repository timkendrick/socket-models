'use strict';

var express = require('express');

module.exports = function(dataService) {

	var app = express();

	app.get('/:collection/:id', function(req, res, next) {
		var collection = req.params.collection;
		var itemId = Number(req.params.id);
		if (!dataService.hasOwnProperty(collection)) { return res.send(404); }

		var collectionService = dataService[collection];
		var item = collectionService.get(itemId);
		res.json(item);
	});

	return app;
};
