var cluster         = require( 'cluster' );
var cCPUs           = require('os').cpus().length;
	 cCPUs = 2;
var fs 				= require("fs");

var mongojs 		= require('mongojs');
var lnconfiguration	= JSON.parse(fs.readFileSync('luckynode.conf', 'utf8'));
//console.log(lnconfiguration);
var cloudConnStr	= lnconfiguration.db.connstr;
var cloudColls		= ['users','datacenters','nodes','ipblocks','storages','nodecs','nodetokens','managers','plans','servers','images', 'imagegroups','isofiles', 'logs', 'userfiles', 'settings', 'invoices', 'counters', 'mailtemplates', 'library', 'templateDocs', 'userRequests', 'transactions', 'countries', 'cclogs'];
var db 				= mongojs(cloudConnStr, cloudColls);
db.on('connect', function dbConnected(theResult){
	console.log("=============================================================");
	console.log("Database connected");
	//console.log(theResult,"a");
	console.log("=============================================================");
});
db.on('close', function dbClosed(theResult){
	console.log("=============================================================");
	console.log("Database closed");
	console.log(theResult);
	console.log("=============================================================");
});
db.on('disconnect', function dbDisconnected(theResult){
	console.log("=============================================================");
	console.log("Database disconnected");
	console.log(theResult);
	console.log("=============================================================");
});

db.on('error', function(err) {
	console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
   console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
   console.log('Catch ', err);
   console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
   console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
});
//db.servers.find(function(err, result){console.log(result);});

var App             = require('./config/config.app.js');
var cronerpid 		= 0;
var Croner          = require('./config/config.croner.js');

if( cluster.isMaster ) {

    var croner_env = {}; croner_env.isCroner = 1;
    var worker_env = {}; worker_env.isCroner = 0;

    for( var i = 0; i < cCPUs; i++ ) {
        var workerpid = cluster.fork(worker_env).process.pid;
    }
    cronerpid = cluster.fork(croner_env).process.pid;

    cluster.on( 'online', function( worker ) {
    	if(worker.process.pid == cronerpid){
        	console.log( 'Croner ' + worker.process.pid + ' is online.' );
    	} else {
    		console.log( 'Worker ' + worker.process.pid + ' is online.' );
    	}
    });
    cluster.on( 'exit', function( worker, code, signal ) {
        if(worker.process.pid == cronerpid){
        	console.log( 'Croner ' + worker.process.pid + ' died.' );
        	cronerpid = cluster.fork(croner_env).process.pid;
        } else {
        	console.log( 'Worker ' + worker.process.pid + ' died.' );
        	cluster.fork(worker_env);
        }
    });
} else {
	if(process.env.isCroner == 1){
		var croner = new Croner(db);
	} else {
		var app = new App(db);
	}
}