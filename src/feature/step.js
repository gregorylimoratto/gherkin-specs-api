/* jshint globalstrict: true */
/* global StepParser */
'use strict';

function Step(keyword, description, parameters, keywordText) {
	this.keyword = keyword;
	this.description = description;
	this.parameters = parameters;
	this.keywordText = keywordText;
}

Step.prototype.stringify = function () {
	return new StepParser(this.keywordText, this.description, this.parameters).stringify();
};
