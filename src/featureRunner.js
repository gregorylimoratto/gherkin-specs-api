/* global xdescribe */
/* global ddescribe */
/* global iit */
/* global fit */
/* global fdescribe */
/* global it */
/* global describe */
/* global window */
/* global module */
/* global console */
/* jshint globalstrict: true */
'use strict';
function createRunnableStep(delegate, description) {
	return {
		description: description,
		step: function (scenarioContext) {
			if (delegate) {
				return delegate(scenarioContext);
			} else {
				throw new Error(description + "\nStep not found exception");
			}
		}
	};
}

function logBeforeRun(featureRunner) {
	var scenarios = featureRunner.features.reduce(function (memo, f) {
		return memo + f.scenarios.length;
	}, 0);
	console.log('Found ' + featureRunner.features.length + ' features with ' + scenarios + ' scenarios');
}

function FeatureRunner() {
	this.features = [];
	this.featuresImplementations = null;
}

FeatureRunner.prototype.run = function () {
	logBeforeRun(this);
	var self = this;
	this.features.forEach(function (feature) {
		self.runFeature(feature);
	});
};

FeatureRunner.prototype.runFeature = function (feature) {
	var self = this;
	if (!this.featuresImplementations) { throw new Error("No feature specs implemented, implements scenarios with featureSteps(...).given(...).when(...).then(...)...")}
	var featureStepsDefinition = this.featuresImplementations.getMatchingFeatureStepsDefinition(feature);

	describe('\nFeature: ' + feature.description, function () {
		feature.scenarios.forEach(function (scenario) {
			self.runScenario(scenario, featureStepsDefinition);
		});
	});
};

FeatureRunner.prototype.runScenario = function (scenario, featureStepsDefinition) {
	var ignoreScenario = scenario.isIgnored;
	if (!ignoreScenario && !scenario.excludeOthers) {
		ignoreScenario = this.features.some(function (feature) {
			return feature.scenarios.some(function (scenar) {
				return scenar.excludeOthers;
			})
		});
	}

	// TODO : Extract describe / it func in config so we can switch to any test framework	
	var globalObj = (typeof window !== 'undefined' ? window : global); // global for node else, window
	var describe = ignoreScenario ? globalObj.xdescribe : globalObj.describe;
	describe('\n\nScenario: ' + scenario.description, this.runSteps(scenario, featureStepsDefinition));
};

FeatureRunner.prototype.runSteps = function (scenario, featureStepsDefinition) {
	var scenarioExecutableSteps = this.extractExecutableSteps(scenario, featureStepsDefinition);
	var description = scenarioExecutableSteps.reduce(function (memo, item) {
		memo += item.description ? '\n\t' + item.description : '';
		return memo;
	}, '');

	var scenarioContext = {};
	return function () {
		it(description, function (done) {
			var delegatePromise;
			scenarioExecutableSteps.forEach(function (executable) {
				// if the previous step return a promise, we have to chain other steps on this promise.				
				if (delegatePromise) {
					// async flow
					delegatePromise = delegatePromise.then(function () {
						return executable.step(scenarioContext);
					});
				} else {
					// sync flow
					var promise = executable.step(scenarioContext);
					// if the step return a promise, then we keep it to chain the futur steps 
					if (promise && promise.then) {
						delegatePromise = promise;
					}
				}
			})
			// if the flow was async, then the test is done when all promises are done
			if (delegatePromise) {
				delegatePromise
					.then(done)
					.catch(function(err){
						// catch promises errors if an assert is made in the flow and is in error
						if (err instanceof Error){
							done(err);
						}else{
							// promise rejection that are not error and are not catch are errors !
							var error = JSON.stringify(err, undefined, 4);
							done(new Error(error));
						}
					});
			} else {
				done();
			}
		});
	};
};

FeatureRunner.prototype.extractExecutableSteps = function (scenario, featureStepsDefinition) {
	var beforeSteps = featureStepsDefinition.beforeSteps.map(function (definition) {
		return createRunnableStep(function (scenarioContext) {
			definition.apply(scenarioContext);
		}, '');
	});
	var afterSteps = featureStepsDefinition.afterSteps.map(function (definition) {
		return createRunnableStep(function (scenarioContext) {
			definition.apply(scenarioContext);
		}, '');
	});
	var runnableSteps = scenario.steps.map(function (step) {
		var stepToRun = featureStepsDefinition.getStep(step);
		return createRunnableStep(stepToRun, step.stringify());
	});
	var scenarioExecutableSteps = [].concat(beforeSteps)
		.concat(runnableSteps)
		.concat(afterSteps);
	return scenarioExecutableSteps;
};

