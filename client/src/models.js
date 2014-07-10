'use strict';

var models = angular.module('models', []);

models.value('QuoteModel',

	function QuoteModel() {
		this.field1 = null;
		this.field2 = null;
		this.field3 = null;
		this.field4 = null;
		this.field5 = null;
		this.field6 = null;
		this.field7 = null;
		this.field8 = null;
		this.field9 = null;
		this.field10 = null;
	}
);


models.service('ModelMappings', function(QuoteModel) {
	return {
		'quote': QuoteModel
	};
});
