/* jshint globalstrict: true */
/* global Feature */
/* global FeaturesImplementations */
/* global FeatureRunner */
/* global window */
/* global module */
(function (exports) {
	'use strict';

	var runner = null;
	function getFeatureRunner(){
		if (!runner || runner.hasRun){ runner = new FeatureRunner(); }
		return runner;
	}
	
	function getApiInterface() {
		return {
			"feature": function (description) {
				var feature = new Feature(description);
				getFeatureRunner().features.push(feature);
				return feature;
			},
			"featureSteps": function (featurePattern) {
				return getFeatureRunner().featuresImplementations.addFeature(featurePattern);
			},
			"featureRunner": function () {
				return getFeatureRunner();
			}
		};
	}
	
	var apiInterface = getApiInterface();
	exports = exports || {};
	for (var property in apiInterface) {
		if (apiInterface.hasOwnProperty(property)) {
			exports[property] = apiInterface[property];
		}
	}
})(typeof module !== "undefined" &&
    module.exports ? module.exports : window);