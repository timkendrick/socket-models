'use strict';

var services = angular.module('services', ['models']);


services.service('QuoteService', function(ModelService) {

 	function QuoteService() {

		this.getQuote = function(id) {
			return ModelService.retrieve('quote', id);
		};

		this.getFeaturedQuote = function(id) {
			return ModelService.retrieve('quote', 'featured');
		};
	}

	return new QuoteService();
});


services.service('ModelService', function($http, ModelSerializationService, SocketService, restApiUrl) {

	function ModelService() {

		this.create = function(collection, model) {
			var endpoint = _getEndpointPath(collection);
			return _sendRequest('POST', endpoint, model);
		};

		this.retrieve = function(collection, id) {
			var endpoint = _getEndpointPath(collection, id);
			return _sendRequest('GET', endpoint);
		};

		this.update = function(collection, id, model) {
			var endpoint = _getEndpointPath(collection, id);
			return _sendRequest('PUT', endpoint, model);
		};

		this.delete = function(collection, id) {
			var endpoint = _getEndpointPath(collection, id);
			return _sendRequest('DELETE', endpoint);
		};

		this.subscribe = function(request, fields) {
			var resolvedValue = null;
			var socketSubscription = null;

			var subscription = request.then(function(model) {
				resolvedValue = model;
				socketSubscription = SocketService.subscribe(model, fields);
				return socketSubscription;
			});

			subscription.get = function() {
				return resolvedValue;
			};

			subscription.unsubscribe = function() {
				return SocketService.unsubscribe(subscription);
			};

			return subscription;
		};


		function _getEndpointPath(collection, id) {
			return collection + (id || (id === 0) ? '/' + id : '');
		}

		function _sendRequest(method, endpoint, data) {
			var resolvedValue = null;
			var request = $http({
				method: method,
				url: restApiUrl + '/' + endpoint,
				data: data,
				requestType: 'json',
				responseType: 'json'
			}).then(function(response) {
				resolvedValue = ModelSerializationService.deserialize(response.data);
				return resolvedValue;
			});

			request.get = function() {
				return resolvedValue;
			};

			return request;
		}
	}

	return new ModelService();
});


services.service('ModelSerializationService', function(ModelMappings) {

	function ModelSerializationService() {

		this.serialize = function(model) {
			if (!model) { return null; }

			var modelId = this.getModelId(model);
			var typeName = this.getModelType(model);

			return {
				id: modelId,
				type: typeName,
				value: _serializeObject(model)
			};

			function _serializeObject(object) {
				return angular.copy(object);
			}
		};

		this.deserialize = function(data) {
			if (!data) { return null; }

			var typeName = data.type;
			var modelId = data.id;
			var fieldValues = data.value;


			var MappedType = ModelMappings[typeName] || Object;
			var instance = new MappedType();
			instance.$$$id = modelId;
			for (var property in fieldValues) {
				instance[property] = angular.copy(fieldValues[property]);
			}
			return instance;
		};

		this.getModelId = function(model) {
			return model.$$$id;
		};

		this.getModelType = function(model) {
			var modelType = model.constructor;
			for (var typeName in ModelMappings) {
				var MappedType = ModelMappings[typeName];
				if (MappedType === modelType) {
					return typeName;
				}
			}
			return null;
		};
	}

	return new ModelSerializationService();
});


services.service('SocketService', function($q, socketApiUrl, AsyncDigestService, ModelSerializationService) {

	function SocketService() {
		var subscriptions = [];
		var socket = io(socketApiUrl);

		this.subscribe = function(model, watchedFields) {
			if (!model) { throw new Error('No model specified'); }

			var type = ModelSerializationService.getModelType(model);
			if (!type) { throw new Error('Invalid model type'); }

			var id = ModelSerializationService.getModelId(model);
			var fields = (watchedFields ? watchedFields.slice() : null);
			var token = this.generateToken();

			var deferred = $q.defer();
			var subscriptionMetadata = {
				token: token,
				type: type,
				id: id,
				fields: fields,
				model: model,
				deferred: deferred
			};
			subscriptions.push(subscriptionMetadata);

			socket.emit('subscribe', token, type, id, fields);

			socket.on(token, _handleDataReceived);

			deferred.promise.finally(function() {
				socket.removeListener(token, _handleDataReceived);

				socket.emit('unsubscribe', token);

				var index = subscriptions.indexOf(subscriptionMetadata);
				subscriptions.splice(index, 1);
			});

			return deferred.promise;

			/*
			 * Subscription changesets expect the following format:
			 *
			 * 	{ "token": "24f5b6156a2ac94785fbe77621f16de136aa0027", "type": "quote", "id": 3, "changes": { "price": 121.232, "spread": 12 } }
			 */
			function _handleDataReceived(changeset) {
				AsyncDigestService.apply(function() {
					var changes = changeset.changes;
					for (var field in changes) {
						model[field] = changes[field];
					}
					deferred.notify(changes);
				});
			}
		};

		this.unsubscribe = function(subscription) {
			var subscriptionMetadata = _getSubscriptionMetadata(subscription);
			if (!subscriptionMetadata) { return; }
			subscriptionMetadata.deferred.resolve(subscriptionMetadata.model);


			function _getSubscriptionMetadata(subscription) {
				return subscriptions.filter(function(subscriptionMetadata) {
					return (subscriptionMetadata.deferred.promise === subscription);
				})[0] || null;
			}
		};

		this.generateToken = function() {
			var TOKEN_CHARACTERS = '0123456789abcdef';
			var string = '';
			while (string.length < 40) { string += TOKEN_CHARACTERS.charAt(Math.floor(Math.random() * TOKEN_CHARACTERS.length)); }
			return string;
		};
	}

	return new SocketService();
});


services.service('AsyncDigestService', function($rootScope) {

	function AsyncDigestService() {
		var queuedActions = [];
		var nextDigest = null;

		this.apply = function(fn) {
			if (fn) { queuedActions.push(fn); }
			var alreadyUpdating = Boolean(nextDigest);
			if (alreadyUpdating) { return; }
			nextDigest = window.requestAnimationFrame(_handleTimeoutCompleted);

			function _handleTimeoutCompleted() {
				nextDigest = null;
				$rootScope.$apply(function() {
					queuedActions.forEach(function(fn) {
						if (fn) { fn(); }
					});
					queuedActions.length = 0;
				});
			}
		};
	}

	return new AsyncDigestService();
});
