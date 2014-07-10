'use strict';

var app = angular.module('test-app', ['services']);


app.controller('TestCtrl', function TestCtrl($scope, DocketService, QuoteService) {
		$scope.docket = null;
		$scope.quote = null;

		var quoteId = 1;

		// var docketId = 1;
		// var docketRequest = DocketService.retrieve(docketId)
		// 	.done(function(model) {
		// 		$scope.docket = model;
		// 	});


		var quoteSubscription = QuoteService.retrieve(quoteId).done(function(model) {
				window.console.info('Loaded quote', model);
			})
			.subscribe(['value1', 'value2', 'value3']).listen(function(changes) {
				window.console.info('Updated quote', changes);
			});


		$scope.$on('$destroy', function() {
			// docketRequest.cancel();
			quoteSubscription.cancel();
		});
	}
);


app.service('QuoteService', function(ModelService) {

 	function QuoteService() {
		var MODEL_TYPE = 'quote';

		this.create = function(model) {
			return ModelService.create(MODEL_TYPE, model);
		};

		this.retrieve = function(id) {
			return ModelService.retrieve(MODEL_TYPE, id);
		};

		this.update = function(id, model) {
			return ModelService.update(MODEL_TYPE, id, model);
		};

		this.delete = function(id) {
			return ModelService.delete(MODEL_TYPE, id);
		};
	}

	return new QuoteService();
});


app.service('DocketService', function(ModelService) {

	function DocketService() {
		var MODEL_TYPE = 'docket';

		this.create = function(model) {
			return ModelService.create(MODEL_TYPE, model);
		};

		this.retrieve = function(id) {
			return ModelService.retrieve(MODEL_TYPE, id);
		};

		this.update = function(id, model) {
			return ModelService.update(MODEL_TYPE, id, model);
		};

		this.delete = function(id, subscribe) {
			return ModelService.delete(MODEL_TYPE, id);
		};
	}

	return new DocketService();
});
