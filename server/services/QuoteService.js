'use strict';

function QuoteService() {
	this.items = [];

	var FIELD_NAMES = ['value1', 'value2', 'value3', 'value4', 'value5', 'value6', 'value7', 'value8', 'value9', 'value10'];
	var MIN_UPDATE_INTERVAL = 500;
	var MAX_UPDATE_INTERVAL = 1500;

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

	var updaters = [];

	this.subscribe = function(id, fields, callback) {
		if (!this.exists(id)) { throw new Error('Invalid ID specified: "' + id + '"'); }

		var quote = this.get(id);

		if (!updaters[id]) {
			var updater = {
				quote: quote,
				timer: null,
				subscriptions: []
			};
			updaters[id] = updater;
			_startUpdateTimer(updater);
		}

		var quoteUpdater = updaters[id];
		var quoteSubscriptions = quoteUpdater.subscriptions;

		var subscription = {
			fields: fields,
			callback: callback,
			unsubscribe: function() {
				var index = quoteSubscriptions.indexOf(subscription);
				quoteSubscriptions.splice(index, 1);
				var allSubscriptionsRemoved = quoteSubscriptions.length === 0;
				if (allSubscriptionsRemoved) {
					_clearUpdateTimer(quoteUpdater);
					delete updaters[id];
				}
			}
		};

		quoteSubscriptions.push(subscription);

		return subscription;


		function _startUpdateTimer(updater) {
			updater.timer = setTimeout(function _updateTimeout() {
				_updateQuote(quote, updater.subscriptions);
				var delay = MIN_UPDATE_INTERVAL + Math.random() * (MAX_UPDATE_INTERVAL - MIN_UPDATE_INTERVAL);
				updater.timer = setTimeout(_updateTimeout, delay);
			}, Math.random() * (MAX_UPDATE_INTERVAL - MIN_UPDATE_INTERVAL));
		}

		function _clearUpdateTimer(updater) {
			clearTimeout(updater.timer);
			updater.timer = null;
		}
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
	}

	function _updateQuote(quote, subscriptions) {
		var changes = _updateQuoteValues(quote);
		if (!changes) { return null; }
		subscriptions.forEach(function(subscription) {
			var changeset = _getChangeset(changes, subscription.fields);
			if (!changeset) { return; }
			var callback = subscription.callback;
			callback(changes);
		});
		return changes;
	}

	function _getChangeset(changes, subscribedFields) {
		if (!subscribedFields) { return changes; }
		var changedFields = Object.keys(changes);
		var relevantChangedFields = subscribedFields.filter(function(subscribedField) {
			return changedFields.indexOf(subscribedField) !== -1;
		});
		if (relevantChangedFields.length === 0) { return null; }
		var changeset = relevantChangedFields.reduce(function(changeset, fieldName) {
			changeset[fieldName] = changes[fieldName];
			return changeset;
		}, {});
		return changeset;
	}

	function _updateQuoteValues(quote) {
		var numUpdatedFields = 1 + Math.floor(Math.random() * 3);
		var fieldNames = Object.keys(quote.values);
		var updatedFieldNames = _pickRandomArrayItems(fieldNames, numUpdatedFields);

		var changes = updatedFieldNames.reduce(function(changes, fieldName) {
			var updatedValue = _generateRandomValue();
			quote.values[fieldName] = updatedValue;
			changes[fieldName] = updatedValue;
			return changes;
		}, {});

		return changes;
	}

	function _pickRandomArrayItems(array, numItems) {
		numItems = Math.min(array.length, numItems);
		var remainingItems = array.slice();
		var randomItems = [];
		while (randomItems.length < numItems) {
			var randomIndex = Math.floor(Math.random() * remainingItems.length);
			var randomItem = remainingItems.splice(randomIndex, 1)[0];
			randomItems.push(randomItem);
		}
		return randomItems;
	}

	function _generateRandomValue() {
		return Number((Math.random() * 100).toFixed(1));
	}
}

module.exports = new QuoteService();
