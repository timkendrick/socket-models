'use strict';

var io = require('socket.io');

var ModelService = require('./services/ModelService');
var QuoteService = require('./services/QuoteService');


module.exports = function(httpServer) {
	var server = io(httpServer);

	var services = {
		quote: QuoteService
	};

	_initLogging(server);
	_initApi(server, services);


	function _initLogging(server) {
		var numUsers = 0;
		server.on('connection', function(socket) {
			numUsers++;
			console.log('Socket user connected (%s)', _getActiveUsersLabel(numUsers));
			socket.on('disconnect', function() {
				numUsers--;
				console.log('Socket user disconnected (%s)', _getActiveUsersLabel(numUsers));
			});

			function _getActiveUsersLabel(numUsers) {
				return (numUsers === 0 ? 'No' : numUsers) + ' active ' + (numUsers === 1 ? 'user' : 'users');
			}
		});
	}

	function _initApi(socket, services) {
		server.on('connection', function(socket) {

			var subscriptions = {};

			socket.on('subscribe', function(token, type, id, fields) {
				if (!token) { console.error('No subscription token specified'); }
				if (!/[0-9a-f]{40}/.test(token)) { console.error('Invalid subscription token specified: "%s"', token); }
				if (!services.hasOwnProperty(type)) { console.error('Invalid collection type: "%s"', type); }

				var collectionService = services[type];
				var model = collectionService.get(id);
				var subscription = ModelService.subscribe(model, fields, _handleModelValuesUpdated);
				subscriptions[token] = subscription;

				console.log('Subscribed to updates for "%s:%d" (%s)', type, id, token);

				function _handleModelValuesUpdated(changes) {
					_emitChanges(token, type, id, changes);
				}
			});

			socket.on('unsubscribe', function(token) {
				if (!token) { console.error('No subscription token specified'); }
				if (!subscriptions.hasOwnProperty(token)) { console.error('Invalid subscription token specified: "%s"', token); }

				var subscription = subscriptions[token];
				subscription.unsubscribe();
				delete subscriptions[token];

				console.log('Unsubscribed from %s', token);
			});

			socket.on('disconnect', function() {
				var numSubscriptions = 0;
				for (var token in subscriptions) {
					var subscription = subscriptions[token];
					subscription.unsubscribe();
					numSubscriptions++;
				}
				if (numSubscriptions > 0) {
					console.log('Unsubscribed from %d subscription(s)', numSubscriptions);
				}
			});

			function _emitChanges(token, type, id, changes) {
				console.log('Emitting to ' + token);
				socket.emit(token, { token: token, type: type, id: id, changes: changes });
			}
		});
	}

	return server;
};
