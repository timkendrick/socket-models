'use strict';

var app = angular.module('test-app', ['services']);


app.controller('TestCtrl', function TestCtrl($scope, QuoteService, ModelService, quoteIds) {

		$scope.featuredQuote = ModelService.subscribe(QuoteService.getFeaturedQuote(), ['field1', 'field2', 'field3']);
		$scope.quotes = quoteIds.map(function(quoteId) {
			return ModelService.subscribe(QuoteService.getQuote(quoteId));
		});

		$scope.$on('$destroy', function() {
			$scope.featuredQuote.unsubscribe();
			$scope.quotes.forEach(function(quote) { quote.unsubscribe(); });
		});
	}
);
