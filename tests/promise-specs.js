/* global featureRunner */
/* global expect */
/* global it */
/* global describe */
/* global featureSteps */
/* jshint globalstrict: true */
'use strict';

feature("Simple promise tests") 
		.scenario("Chain promises and validate spec")
			.given("This step return a promise that is resolved 150 ms latter")
			.when('This step resolve another promise')
			.then('This step is executed after the others');

featureSteps(/Simple promise tests/)
	.given(/This step return a promise that is resolved (\d+) ms latter/, function(delay){
		var defer = Q.defer();
		var self = this;
		setTimeout(function() {
			self.firstPromise = true;
			defer.resolve()
		}, delay);
		return defer.promise;
	})
	.when(/This step resolve another promise/, function(num){
		var defer = Q.defer();
		var self = this;
		setTimeout(function() {
			if (self.firstPromise){
				self.secondPromise = true;
				defer.resolve();
			}
		}, 10);
		return defer.promise;
	})
	.then(/This step is executed after the others/, function(str){
		expect(this.firstPromise).toBeTruthy(); 
		expect(this.secondPromise).toBeTruthy();
	});
	
featureRunner().run();

