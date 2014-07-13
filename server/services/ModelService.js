'use strict';


function ModelService() {

	var MIN_UPDATE_INTERVAL = 500;
	var MAX_UPDATE_INTERVAL = 1500;

	this.types = {};
	this.data = {};

	var modelUpdaters = [];

	this.registerType = function(type, fieldNames) {
		if (!type) { throw new Error('No type name specified'); }
		if (!fieldNames) { throw new Error('No field names specified'); }
		if (this.existsType(type)) { throw new Error('Type name "' + type + '" already exists'); }

		var typeMetadata = {
			fields: fieldNames
		};
		this.types[type] = typeMetadata;
	};

	this.create = function(type, id) {
		if (!id) { throw new Error('No ID specified'); }
		if (!this.existsType(type)) { throw new Error('Invalid type specified: "' + type + '"'); }
		if (this.exists(type, id)) { throw new Error('ID "' + id + '" already exists'); }

		var typeMetadata = this.types[type];
		var model = _createModel(type, typeMetadata.fields, id);

		if (!this.data.hasOwnProperty(type)) { this.data[type] = []; }
		this.data[type][id] = model;

		return model;


		function _createModel(type, typeFields, id) {
			var model = {
				type: type,
				id: id,
				value: _generateRandomModelFieldValues(typeFields)
			};
			return model;


			function _generateRandomModelFieldValues(fieldNames) {
				return fieldNames.reduce(function(values, fieldName) {
					values[fieldName] = _generateRandomValue();
					return values;
				}, {});
			}

			function _generateRandomValue() {
				return Number((Math.random() * 100).toFixed(1));
			}
		}
	};

	this.retrieve = function(type, id) {
		if (!type) { throw new Error('No type name specified'); }
		if (!id) { throw new Error('No ID specified'); }
		if (!this.existsType(type)) { throw new Error('Invalid type specified: "' + type + '"'); }

		if (!this.exists(type, id)) { return null; }
		return this.data[type][id];
	};

	this.update = function(type, id, model) {
		if (!type) { throw new Error('No type name specified'); }
		if (!id) { throw new Error('No ID specified'); }
		if (!this.exists(type, id)) { throw new Error('Invalid ID specified: "' + id + '"'); }
		if (!model) { throw new Error('No model specified'); }

		var existingModel = this.data[type][id];
		for (var field in model) {
			existingModel[field] = model[field];
		}
		return existingModel;
	};

	this.delete = function(type, id) {
		if (!type) { throw new Error('No type name specified'); }
		if (!id) { throw new Error('No ID specified'); }
		if (!this.exists(type, id)) { throw new Error('Invalid ID specified: "' + id + '"'); }

		var existingModel = this.data[type][id];
		delete this.data[type][id];
		return existingModel;
	};

	this.exists = function(type, id) {
		if (!type) { throw new Error('No type name specified'); }
		if (!id) { throw new Error('No ID specified'); }

		if (!this.existsType(type)) { return false; }
		var typeModels = this.data[type];
		if (!typeModels) { return false; }
		return Boolean(typeModels[id]);
	};

	this.existsType = function(type) {
		if (!type) { throw new Error('No type name specified'); }
		return this.types.hasOwnProperty(type);
	};

	this.subscribe = function(model, fields, callback) {
		if (!model) { throw new Error('Invalid model specified'); }

		var modelUpdater = _getModelUpdater(model);
		var modelSubscriptions = modelUpdater.subscriptions;

		var subscription = {
			fields: fields,
			callback: callback,
			unsubscribe: function() {
				var index = modelSubscriptions.indexOf(subscription);
				modelSubscriptions.splice(index, 1);
				var allSubscriptionsRemoved = modelSubscriptions.length === 0;
				if (allSubscriptionsRemoved) {
					_removeModelUpdater(modelUpdater);
				}
			}
		};

		modelSubscriptions.push(subscription);

		return subscription;


		function _getModelUpdater(model) {
			return _retrieveExistingModelUpdater(model) || _createModelUpdater(model);

			function _retrieveExistingModelUpdater(model) {
				return modelUpdaters.filter(function(modelUpdater) {
					return (modelUpdater.model === model);
				})[0] || null;
			}
		}

		function _createModelUpdater(model) {
			var updater = {
				model: model,
				timer: null,
				subscriptions: []
			};
			modelUpdaters.push(updater);
			_startUpdateTimer(updater);
			return updater;
		}

		function _removeModelUpdater(updater) {
			_clearUpdateTimer(updater);
		}

		function _startUpdateTimer(updater) {
			updater.timer = setTimeout(function _updateTimeout() {
				_updateModel(model, updater.subscriptions);
				var delay = MIN_UPDATE_INTERVAL + Math.random() * (MAX_UPDATE_INTERVAL - MIN_UPDATE_INTERVAL);
				updater.timer = setTimeout(_updateTimeout, delay);
			}, Math.random() * (MAX_UPDATE_INTERVAL - MIN_UPDATE_INTERVAL));
		}

		function _clearUpdateTimer(updater) {
			clearTimeout(updater.timer);
			updater.timer = null;
		}

		function _updateModel(model, subscriptions) {
			var modelKeys = Object.keys(model);
			var watchedFields = _getAllSubscribedFields(modelKeys, subscriptions);
			if (watchedFields.length === 0) { return null; }
			var changeset = _updateModelValues(model, watchedFields);
			if (!changeset) { return; }
			subscriptions.forEach(function(subscription) {
				var relevantChanges = _getRelevantChanges(changeset, subscription.fields);
				var callback = subscription.callback;
				callback(relevantChanges);
			});
			return changeset;

			function _getRelevantChanges(changeset, watchedFields) {
				if (!watchedFields) { return changeset; }
				var filteredChanges = {};
				for (var field in changeset) {
					var isWatchedField = (watchedFields.indexOf(field) !== -1);
					if (!isWatchedField) { continue; }
					filteredChanges[field] = changeset[field];
				}
				return filteredChanges;
			}

			function _getAllSubscribedFields(allKeys, subscriptions) {
				var shouldUpdateAllFields = subscriptions.some(function(subscription) { return !subscription.fields; });
				if (shouldUpdateAllFields) {
					return allKeys;
				}

				return subscriptions.reduce(function _getAllWatchedFields(watchedFields, subscription) {
						return watchedFields.concat(subscription.fields);
					}, [])
					.filter(function _getUniqueValues(value, index, array) {
						return (array.indexOf(value) === index);
					});
			}
		}

		function _updateModelValues(model, fields) {
			var numUpdatedFields = 1 + Math.floor(Math.random() * fields.length);
			var fieldNames = Object.keys(model.value);
			var updatedFieldNames = _pickRandomArrayItems(fieldNames, numUpdatedFields);

			var changes = updatedFieldNames.reduce(function(changes, fieldName) {
				var updatedValue = _generateRandomValue();
				model.value[fieldName] = updatedValue;
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
	};
}

module.exports = new ModelService();
