
/* jshint globalstrict: true */
/* global Step */
'use strict';

function Scenario(description, feature) {
  this.description = description;
  this.steps = [];
  this.feature = feature;
  this._keyword = "given";
}

Scenario.prototype.ignoreOthers = function(){
	this.excludeOthers = true;
	return this;
}

Scenario.prototype.ignore = function(){
	this.isIgnored = true;
	return this;
}

Scenario.prototype.addStep = function (stepKeyword, description, parameters) {
  this.steps.push(new Step(this._keyword, description, parameters, stepKeyword));
};

Scenario.prototype.given = function (description, parameters) {
  this._keyword = "given";
  this.addStep("Given", description, parameters);
  return this;
};

Scenario.prototype.when = function (description, parameters) {
  this._keyword = "when";
  this.addStep("When", description, parameters);
  return this;
};

Scenario.prototype.then = function (description, parameters) {
  this._keyword = "then";
  this.addStep("Then", description, parameters);
  return this;
};

Scenario.prototype.and = function (description, parameters) {
  this.addStep("And", description, parameters);
  return this;
};

Scenario.prototype.scenario = function (description) {
  return this.feature.scenario(description);
};
