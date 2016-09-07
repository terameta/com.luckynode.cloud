var tools			= require('../tools/tools.main.js');

module.exports = function Croner(db) {
	var croner				= require('cron').CronJob;
	//var cronFs			= require('../tools/tools.crons')(db);
	var invoiceModule 		= require('../modules/module.invoice.js')(db);
	var jobS = new croner(
		'*/10 * * * * *',
		function(){
			invoiceModule.startProcess();
		}, function(){
			console.log("This is the end of every ten seconds");
		},
		true,
		"America/Los_Angeles"
	);
	var jobM = new croner(
		'0 * * * * *',
		function(){
			invoiceModule.informBalances();
		}, function(){
			console.log("This is the end of every ten seconds");
		},
		true,
		"America/Los_Angeles"
	);
	//var jobM = 	new croner('0 * * * * *',function(){crones.everyminute();}, function(){ console.log("This is the end");},true,"America/Los_Angeles");
	//var job2H = new croner('0 0 */2 * * *',function(){crones.everyotherhour();}, function(){ console.log("This is the end");},true,"America/Los_Angeles");
	//var jobH = new croner('0 0 * * * *',function(){crones.everyhour();  }, function(){ console.log("This is the end");},true,"America/Los_Angeles");
	//var jobTM = new croner('30 5,15,25,35,45,55 * * * *',function(){crones.everytenminutes();  }, function(){ console.log("This is the end");},true,"America/Los_Angeles");
	module.exports = Croner;
};