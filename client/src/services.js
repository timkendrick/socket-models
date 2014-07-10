'use strict';

var services = angular.module('services', []);

services.service('RestService', function($q, $http, restApiUrl) {

	function RestService() {
		var baseUrl = restApiUrl;
		var activeRequests = [];


		this.get = function(endpoint) {
			var method = 'GET';
			return _send(method, endpoint);
		};

		this.post = function(endpoint, data) {
			var method = 'POST';
			return _send(method, endpoint, data);
		};

		this.put = function(endpoint, data) {
			var method = 'PUT';
			return _send(method, endpoint, data);
		};

		this.delete = function(endpoint) {
			var method = 'DELETE';
			return _send(method, endpoint);
		};

		this.cancelRequest = function(request) {
			return _cancelRequest(request);
		};


		function _send(method, endpoint, data) {
			var canceler = $q.defer();

			var request = $http({
				method: method,
				url: baseUrl + '/' + endpoint,
				data: data,
				requestType: 'json',
				responseType: 'json',
				timeout: canceler
			}).then(function(response) {
				return response.data;
			});

			var requestMetadata = {
				request: request,
				cancel: function() {
					canceler.resolve();
				}
			};
			activeRequests.push(requestMetadata);

			request.finally(function() {
				var index = activeRequests.indexOf(requestMetadata);
				if (index !== -1) { activeRequests.splice(index, 1); }
			});

			return request;
		}


		function _cancelRequest(request) {
			var requestMetadata = _getRequestMetadata(request);
			if (!requestMetadata) { return; }
			requestMetadata.cancel();


			function _getRequestMetadata(request) {
				return activeRequests.filter(function(requestMetadata) {
					return (requestMetadata.request === request);
				})[0] || null;
			}
		}
	}

	return new RestService();
});


services.service('SocketService', function($rootScope, $q, socketApiUrl) {

	function SocketService() {
		var subscriptions = [];
		var socket = io(socketApiUrl);


		var queuedActions = [];
		var nextDigest = null;

		function _asyncDigest(fn) {
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
		}

		/*
		 * The `update` event expects an array parameter that indicates a batch of changes
		 * that have been made to the models. This takes the following format:
		 *	[
		 *		{ "token": "24f5b6156a2ac94785fbe77621f16de136aa0027", "type": "quote", "id": 3, "changes": { "price": 121.232, "spread": 12 } },
		 *		{ "token": "288daff98fe83234499037a8b7208c5c3446da63", "type": "docket", "id": 42, changes: { "name": "My docket 2" } }
		 *	]
		 */
		socket.on('update', function(batch) {
			if (!angular.isArray(batch)) { batch = [batch]; }
			_asyncDigest(function() {
				_applyUpdates(batch);
			});

			function _applyUpdates(batch) {
				batch.forEach(function(changeset) {
					var modelType = changeset.type;
					var modelId = changeset.id;
					var fields = changeset.fields;
					var changes = changeset.changes;

					subscriptions.forEach(function(subscriptionMetadata) {
						var isMatchingModel = (subscriptionMetadata.type === modelType) && (subscriptionMetadata.id === modelId);
						if (isMatchingModel) {
							var model = subscriptionMetadata.model;
							var hasChanged = false;
							for (var updatedField in changes) {
								if (fields && (fields.indexOf(updatedField) === -1)) { continue; }
								model.values[updatedField] = changes[updatedField];
								hasChanged = true;
							}
							if (hasChanged) { subscriptionMetadata.deferred.notify(changes); }
						}
					});
				});
			}
		});


		this.subscribe = function(model, watchedFields) {
			if (!model) { throw new Error('No model specified'); }

			var type = model.type;
			var id = model.id;
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

			deferred.promise.finally(function() {
				socket.emit('unsubscribe', token);

				var index = subscriptions.indexOf(subscriptionMetadata);
				subscriptions.splice(index, 1);
			});

			return deferred.promise;
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


services.service('Subscriber', function($q) {

	return {
		create: Subscriber
	};


	function Subscriber(initialValue, subscribeFunction, unsubscribeFunction, cancelFunction) {
		if (!subscribeFunction) { throw new Error('No subscribe function specified'); }

		var deferred = $q.defer();
		var promise = deferred.promise;

		var initialPromise = $q.when(initialValue);
		initialPromise.then(
			function(value) { promise.value = value; deferred.resolve(value); },
			function(error) { deferred.reject(error); },
			function(value) { deferred.notify(value); }
		);

		promise.done = function(handler) {
			promise.then(
				angular.bind(promise, handler)
			);
			return promise;
		};

		promise.error = function(handler) {
			promise.catch(
				angular.bind(promise, handler)
			);
			return promise;
		};

		promise.cancel = function() {
			if (cancelFunction) { cancelFunction.call(promise, initialValue); }
			deferred.reject();
		};

		promise.subscribe = function(options) {
			return new Subscription(promise, subscribeFunction, options, unsubscribeFunction);
		};

		return promise;
	}


	function Subscription(parentPromise, subscribeFunction, subscribeOptions, unsubscribeFunction) {
		var deferred = $q.defer();
		var subscription = deferred.promise;

		var activeSubscription = null;

		parentPromise.then(function(value) {
			subscription.value = value;
			activeSubscription = subscribeFunction.call(subscription, subscribeOptions);
			return activeSubscription;
		}).then(
			function(value) { deferred.resolve(value); },
			function(error) { deferred.reject(error); },
			function(value) { deferred.notify(value); }
		);

		subscription.ready = function(handler) {
			parentPromise.then(
				angular.bind(subscription, handler),
				function(error) { deferred.reject(error); }
			);
			return subscription;
		};

		subscription.done = function(handler) {
			subscription.then(
				angular.bind(subscription, handler)
			);
			return subscription;
		};

		subscription.error = function(handler) {
			subscription.catch(
				angular.bind(subscription, handler)
			);
			return subscription;
		};

		subscription.listen = function(handler) {
			subscription.then(null, null,
				angular.bind(subscription, handler)
			);
			return subscription;
		};

		subscription.cancel = function() {
			if (activeSubscription) {
				if (unsubscribeFunction) { unsubscribeFunction.call(subscription, activeSubscription); }
				deferred.resolve();
			} else {
				parentPromise.cancel();
			}
		};

		return subscription;
	}
});


services.service('ModelService', function(RestService, SocketService, Subscriber) {

	function ModelService() {

		var subscribe = function(options) { return SocketService.subscribe(this.value); };
		var unsubscribe = function(subscription) { return SocketService.unsubscribe(subscription); };
		var cancelRequest = function(request) { return RestService.cancelRequest(request); };


		this.create = function(collection, model) {
			var endpoint = _getEndpointPath(collection);
			var request = RestService.post(endpoint, model);
			return Subscriber.create(request, subscribe, unsubscribe, cancelRequest);
		};

		this.retrieve = function(collection, id) {
			var endpoint = _getEndpointPath(collection, id);
			var request = RestService.get(endpoint);
			return Subscriber.create(request, subscribe, unsubscribe, cancelRequest);
		};

		this.update = function(collection, id, model) {
			var endpoint = _getEndpointPath(collection, id);
			var request = RestService.get(endpoint);
			return Subscriber.create(request, subscribe, unsubscribe, cancelRequest);
		};

		this.delete = function(collection, id) {
			var endpoint = _getEndpointPath(collection, id);
			var request = RestService.delete(endpoint);
			return request;
		};


		function _getEndpointPath(collection, id) {
			return collection + (id || (id === 0) ? '/' + id : '');
		}
	}

	return new ModelService();
});
