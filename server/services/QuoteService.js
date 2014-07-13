'use strict';

var ModelService = require('./ModelService');

function QuoteService() {
	this.items = [];

	var TYPE_NAME = 'quote';
	var FIELD_NAMES = ['field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'field7', 'field8', 'field9', 'field10'];

	ModelService.registerType(TYPE_NAME, FIELD_NAMES);


	this.create = function(id, model) {
		return ModelService.create(TYPE_NAME, id, model);
	};

	this.retrieve = function(id) {
		return ModelService.retrieve(TYPE_NAME, id);
	};

	this.exists = function(id) {
		return ModelService.exists(TYPE_NAME, id);
	};

	this.getFeatured = function() {
		var featuredId = 1 + Math.floor(Math.random() * 100);
		return ModelService.retrieve(TYPE_NAME, featuredId) || ModelService.create(TYPE_NAME, featuredId);
	};
}

module.exports = new QuoteService();
