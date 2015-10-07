(function () {/* jshint globalstrict: true */
/* global Feature */
/* global FeaturesImplementations */
/* global FeatureRunner */
/* global window */
/* global module */
(function (exports) {
var runner;
	var features = [];
	var featuresImplementations;

	function getApiInterface() {
		return {
			"feature": function (description) {
				var feature = new Feature(description);
				features.push(feature);
				return feature;
			},
			"featureSteps": function (featurePattern) {
				featuresImplementations = featuresImplementations || new FeaturesImplementations();
				return featuresImplementations.addFeature(featurePattern);
			},
			"featureRunner": function () {
				runner = runner || new FeatureRunner();
				runner.features = features;
				runner.featuresImplementations = featuresImplementations;
				return runner;
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
})(typeof window !== 'undefined' ? window : module.exports);

/* jshint globalstrict: true */
/* global Scenario*/
function Feature(description) {
	this.description = description;
	this.scenarios = [];
}

Feature.prototype.ignoreOthers = function(){
	this.excludeOthers = true;
	return this;
}

Feature.prototype.ignore = function(){
	this.isIgnored = true;
	return this;
}

Feature.prototype.scenario = function (description) {
	var scenario = new Scenario(description, this);
	// feature transitive value for @ignoreOthers & @ignore
	if (this.excludeOthers)
		scenario.ignoreOthers();
		
	if (this.isIgnored)
		scenario.ignore();
	
	this.scenarios.push(scenario);
	return scenario;
}; 


/* jshint globalstrict: true */
/* global Step */
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

/* jshint globalstrict: true */
/* global StepParser */
function Step(keyword, description, parameters, keywordText) {
	this.keyword = keyword;
	this.description = description;
	this.parameters = parameters;
	this.keywordText = keywordText;
}

Step.prototype.stringify = function () {
	return new StepParser(this.keywordText, this.description, this.parameters).stringify();
};

/* jshint globalstrict: true */
function StepParser(keyWord, description, parameters) {
	this.keyWord = keyWord;
	this.description = description;

	this.parameters = parameters ? parameters : null;

	if (this.parameters && !Array.isArray(this.parameters)) {
		this.parameters = [this.parameters];
	}
}

StepParser.NewLine = '\n\t | ';
StepParser.Separator = ' | ';

StepParser.prototype.getParametersNames = function () {
	return Object.keys(this.parameters[0]);
};

StepParser.prototype.getParameterMaxLength = function (paramKey) {
	return this.parameters.map(function (param) {
		return param[paramKey];
	}).reduce(function (longest, entry) {
		return entry.length > longest ? entry.length : longest;
	}, paramKey.length);
};

StepParser.prototype.formatParameter = function (key, value) {
	var paramKeys = this.getParametersNames();
	var length = this.getParameterMaxLength(key, paramKeys);
	var padding = new Array(length).join(' ');
	return (padding + value).slice(-1 * length) + StepParser.Separator;
};

StepParser.prototype.stringify = function () {
	var stepFullDescription = this.keyWord + " " + this.description;

	if (this.parameters) {
		stepFullDescription += this.stringifyParams();
	}
	return stepFullDescription;
};

StepParser.prototype.stringifyParams = function () {
	var stepParams = StepParser.NewLine;

	var paramKeys = this.getParametersNames();

	var self = this;
	paramKeys.forEach(function (key) {
		stepParams += self.formatParameter(key, key);
	});

	this.parameters.forEach(function (param) {
		stepParams += StepParser.NewLine;
		paramKeys.forEach(function (key) {
			stepParams += self.formatParameter(key, param[key]);
		});
	});

	return stepParams;
};

function featureStepStringify(keyword, description, parameters) {
	return new StepParser(keyword, description, parameters).stringify();
}
	
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


/* jshint globalstrict: true */
function FeatureSteps(featurePattern) {
    var regexp = featurePattern instanceof RegExp ? featurePattern : new RegExp(featurePattern.replace(/[\ \t]*[\n\r]+[\ \t]*/g, ""));
    this.pattern = regexp;
    this.beforeSteps = [];
    this.afterSteps = [];
    this.steps = [];
}

FeatureSteps.prototype.before = function (delegate) {
    this.beforeSteps.push(delegate);
    return this;
};

FeatureSteps.prototype.after = function (delegate) {
    this.afterSteps.push(delegate);
    return this;
};

FeatureSteps.prototype.given = function (pattern, definition) {
    return this.addStep("given", pattern, definition);
};
FeatureSteps.prototype.when = function (pattern, definition) {
    return this.addStep("when", pattern, definition);
};
FeatureSteps.prototype.then = function (pattern, definition) {
    return this.addStep("then", pattern, definition);
};

FeatureSteps.prototype.addStep = function(keyword, pattern, definition) {
    var regexp = pattern  instanceof RegExp ? pattern : new RegExp('^' + pattern.replace(/[\ \t]*[\n\r]+[\ \t]*/g, "") + '$');
    this.steps.push({ pattern: regexp, definition: definition, keyword: keyword });
    return this;
}

/*
* return an object that contains the function to execute for the step
* and the parameters to give it (from the step definition)
*/
FeatureSteps.prototype.getStep = function (step) {
    var matchingSteps = this.steps
        .map(function (featureStep) {
            var result = featureStep.pattern.exec(step.description);
            return {
                definition: featureStep.definition,
                pattern: featureStep.pattern,
                arguments: result ? result.slice(1).concat([step.parameters]) : null,
                match: !!result && step.keyword === featureStep.keyword
            };
        })
        .filter(function (item) {
            return item.match;
        });

    var stepExectionDelegate = null;
    if (matchingSteps.length === 1) {
        stepExectionDelegate = function (scenarioContext) {
            try {
                var argClone = (JSON.parse(JSON.stringify(matchingSteps[0].arguments))); // avoid arguments update in step definition
                return matchingSteps[0].definition.apply(scenarioContext, argClone); // return the execution so that if it's a promise, we can chain them
            }
            catch (e) {
                throw new Error('error while executing "' + step.description + '"\n ' + e.toString() + '\n' + e.stack);
            }
        };
    }
    return stepExectionDelegate;
};

/* jshint globalstrict: true */
/* global FeatureSteps */
function FeaturesImplementations() {
    this.featureStepsDefinitions = [];
}

FeaturesImplementations.prototype.addFeature = function (featureRegExp) {
    var featureStep = new FeatureSteps(featureRegExp);
    this.featureStepsDefinitions.push(featureStep);
    return featureStep;
};

FeaturesImplementations.prototype.getMatchingFeatureStepsDefinition = function (feature) {
    var relevantFeatureSteps = this.featureStepsDefinitions.filter(function (featureStep) {
        var featureText = feature.description.replace(/[\ \t]*[\n\r]+[\ \t]*/g, "");
        return featureStep.pattern.test(featureText);
    });
    var combineStep = new FeatureSteps('');
    combineStep.steps = relevantFeatureSteps.reduce(function (reduce, item) {
        return reduce.concat(item.steps);
    }, []);
    combineStep.beforeSteps = relevantFeatureSteps.reduce(function (reduce, item) {
        return reduce.concat(item.beforeSteps);
    }, []);
    combineStep.afterSteps = relevantFeatureSteps.reduce(function (reduce, item) {
        return reduce.concat(item.afterSteps);
    }, []);
    return combineStep;
};

    })();