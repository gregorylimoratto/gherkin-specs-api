/* global featureSteps */
/* global feature */
/* global expect */
/* global it */
/* global window */
/* global describe */
/* jshint globalstrict: true */

'use strict';

describe('Feature',function(){
	beforeEach(function(){
		var runner = featureRunner();
		runner.features = [];
	})
	it('should allow feature fluent declaration', function() {
		var feat = feature('jasmine-cucumber: Should support any order');
		feat
			.scenario('can call when after then')
				.given('enqueue "1"')
				.when('enqueue "2"')
				.then('should be "1,2"')
				.when('enqueue "3"')
				.then('should be "1,2,3"')
			.scenario("second scenario")
				.given("given step")
				.when("when step");
		expect(feat.scenarios.length).toBe(2);
		expect(feat.scenarios[0].steps.length).toBe(5);
		expect(feat.scenarios[1].steps.length).toBe(2);
	});
	
	it("should allow fluent features steps definition", function(){
		var featureStep = featureSteps('feature steps');
		featureStep
			.given('enqueue "(.*)"', function(num){ }) 
			.then('should be "(.*)"', function(str){ })
			.given('given step', function(num){ })
			.when('when step', function(){ });
	});
});

describe("Not implemented feature", function(){
	var runner;
	var messages;
	
	function logMessage(message){
		messages.push(message);
	}
	
	beforeEach(function(){
		runner = featureRunner();
		runner.features = [];
		feature('not implemented feature') 
			.scenario('A scenario that is not implemented')
				.given('A given')
				.when('A when')
				.then('A then')
				.then('A then with / and \\');

		messages = [];
		runner = featureRunner();
		runner.logger.out = logMessage;
		runner.run();	
	})
	
	it("should log missing steps for each feature", function(){
		expect(runner.missingSteps["not implemented feature"][0].description).toBe('A given');
		expect(runner.missingSteps["not implemented feature"][1].description).toBe('A when');
		expect(runner.missingSteps["not implemented feature"][2].description).toBe('A then');
	});
	
	it("should log missing steps results after run", function(){
		var expectedLog = 
"featureSteps(/not implemented feature/)\n\
	.given(/A given/, function(){})\n\
	.when(/A when/, function(){})\n\
	.then(/A then/, function(){})\n\
	.then(/A then with \/ and \\\\/, function(){})\n";
		expect(messages[0]).toBe(expectedLog);
	});
});

