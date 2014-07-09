'use strict';

var app = angular.module('test-app', ['services']);


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


app.controller('TestCtrl', function TestCtrl($scope, DocketService, QuoteService) {
		$scope.docket = null;
		$scope.quote = null;

		var docketId = null;
		var quoteId = null;

		var docketRequest = DocketService.retrieve(docketId)
			.done(function(model) {
				$scope.docket = model;
			});


		var quoteSubscription = QuoteService.retrieve(quoteId).done(function(model) {
				window.console.info('Loaded quote', model);
			})
			.subscribe(['price']).listen(function(model) {
				window.console.info('Updated quote', model);
			});


		$scope.$on('$destroy', function() {
			docketRequest.cancel();
			quoteSubscription.cancel();
		});
	}
);
