'use strict';

function QuoteService() {
	this.items = [];

	var FIELD_NAMES = ['field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'field7', 'field8', 'field9', 'field10'];

	this.create = function(id) {
		if (!id) { throw new Error('No ID specified'); }
		if (this.exists(id)) { throw new Error('ID "%d" already exists', id); }

		var quote = _createQuote(id);
		this.items[id] = quote;
		return quote;
	};

	this.exists = function(id) {
		return Boolean(this.items[id]);
	};

	this.get = function(id) {
		if (!id) { throw new Error('No ID specified'); }
		return this.items[id] || this.create(id);
	};

	this.getFeatured = function() {
		var featuredId = 1 + Math.floor(Math.random() * 100);
		return this.get(featuredId) || this.create(featuredId);
	};


	function _createQuote(id) {
		var quote = {
			type: 'quote',
			id: id,
			values: _generateRandomQuoteValues(FIELD_NAMES)
		};
		return quote;

		function _generateRandomQuoteValues(fieldNames) {
			return fieldNames.reduce(function(values, fieldName) {
				values[fieldName] = _generateRandomValue();
				return values;
			}, {});
		}

		function _generateRandomValue() {
			return Number((Math.random() * 100).toFixed(1));
		}
	}
}

module.exports = new QuoteService();
