'use strict';

var app = angular.module('test-app', ['services']);


app.controller('TestCtrl', function TestCtrl($scope, QuoteService, quoteIds) {
		$scope.featuredQuote = QuoteService.retrieve(1).subscribe(['value1', 'value2', 'value3']);
		$scope.quotes = quoteIds.map(function(quoteId) {
			return QuoteService.retrieve(quoteId).subscribe();
		});

		$scope.$on('$destroy', function() {
			$scope.featuredQuote.cancel();
			$scope.quotes.forEach(function(quote) { quote.cancel(); });
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
