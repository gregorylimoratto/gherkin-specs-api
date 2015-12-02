function FeatureRunnerLogger(){}

FeatureRunnerLogger.prototype.out = console.log;

FeatureRunnerLogger.prototype.logMissingSteps = function(missingSteps){
	var cleanStr = function(str){ return str.replace(/\//g,'\/').replace(/\\/g,'\\\\'); };	
	var message = "";
	var log = false;
	for(var missingFeature in missingSteps){
		log = true;
		message += "featureSteps(/"+ cleanStr(missingFeature) +"/)\n";
		
		missingSteps[missingFeature].forEach(function(step){
			message += "	." + step.keyword + "(/" + cleanStr(step.description) + "/, function(){})\n";
		})
	}

	if (log){
		this.out(message);
	}
}