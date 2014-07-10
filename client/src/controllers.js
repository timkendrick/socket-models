'use strict';

var app = angular.module('test-app', ['services']);


app.controller('TestCtrl', function TestCtrl($scope, QuoteService, ModelService, quoteIds) {

		$scope.featuredQuote = ModelService.subscribe(QuoteService.getFeaturedQuote(), ['value1', 'value2', 'value3']);
		$scope.quotes = quoteIds.map(function(quoteId) {
			return ModelService.subscribe(QuoteService.getQuote(quoteId));
		});

		$scope.$on('$destroy', function() {
			$scope.featuredQuote.unsubscribe();
			$scope.quotes.forEach(function(quote) { quote.unsubscribe(); });
		});
	}
);
