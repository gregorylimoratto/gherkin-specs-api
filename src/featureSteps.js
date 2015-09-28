/* jshint globalstrict: true */
'use strict';

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
