'use strict';

var app = angular.module('test-app', ['services']);


app.controller('TestCtrl', function TestCtrl($scope, DocketService, QuoteService, numQuotes) {

		_initFeaturedQuote();
		_initAllQuotes();


		function _initFeaturedQuote() {
			$scope.featuredQuote = null;

			var featuredQuoteSubscription = QuoteService.retrieve(1)
				.done(function(model) { $scope.featuredQuote = model; })
				.subscribe(['value1', 'value2', 'value3']);


			$scope.$on('destroy', function() {
				featuredQuoteSubscription.cancel();
			});
		}


		function _initAllQuotes() {
			var quoteSubscriptions = _loadQuotes(numQuotes);

			var quoteValues = quoteSubscriptions.map(function(quoteSubscription, index) {
				quoteSubscription.ready(function(model) { quoteValues[index] = model; });
				return { };
			});

			$scope.$on('$destroy', function() {
				quoteSubscriptions.forEach(function(quoteSubscription) {
					quoteSubscription.cancel();
				});
			});

			$scope.allQuotes = quoteValues;


			function _loadQuotes(numQuotes) {
				var quoteSubscriptions = [];
				for (var i = 0; i < numQuotes; i++) {
					var quoteId = i + 1;
					var quoteSubscription = QuoteService.retrieve(quoteId).subscribe();
					quoteSubscriptions.push(quoteSubscription);
				}
				return quoteSubscriptions;
			}	
		}
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
