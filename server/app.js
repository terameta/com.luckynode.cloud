var cluster         = require( 'cluster' );
var cCPUs           = require('os').cpus().length;
var fs 				= require("fs");

var mongojs 		= require('mongojs');
var lnconfiguration	= JSON.parse(fs.readFileSync('luckynode.conf', 'utf8'));
var cloudConnStr	= lnconfiguration.db.user+':'+lnconfiguration.db.pass+'@'+lnconfiguration.db.server+':'+lnconfiguration.db.port+'/'+lnconfiguration.db.database;
var cloudColls		= ['users','datacenters','nodes','ipblocks','storages','nodecs','nodetokens','managers','plans','servers','images','isofiles', 'logs'];
var db 				= mongojs(cloudConnStr, cloudColls, {	ssl: true,    authMechanism : 'ScramSHA1',	cert: fs.readFileSync(lnconfiguration.db.pemfile)	});

//mongo monger.luckynode.com:14881/cloud -u 3jPm5YMWG4QPH4rYygItPmDH -p 6l75TzbqGk4Zo114nMjdX7gj --ssl --sslCAFile monger.luckynode.ca.pem

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