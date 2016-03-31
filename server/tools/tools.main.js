var bcrypt   		= require('bcrypt-nodejs');
var jwt				= require('jsonwebtoken');
var config 			= require('../config/config.main.js');
//var mailer			= require('../tools/tools.mailer.js');
var mailer;
var Q				= require('q');
var request 		= require('request');
var mongojs 		= require('mongojs');
var exec 			= require('child_process').exec;
var fs 				= require("fs");
var lnconfiguration	= JSON.parse(fs.readFileSync('luckynode.conf', 'utf8'));
var whoami			= lnconfiguration.whoami;
//var cloudConnStr	= lnconfiguration.db.user+':'+lnconfiguration.db.pass+'@'+lnconfiguration.db.server+':'+lnconfiguration.db.port+'/'+lnconfiguration.db.database;
//var cloudColls		= ['users', 'logs', 'ipblocks'];
//var db 				= mongojs(cloudConnStr, cloudColls, {	ssl: true,    authMechanism : 'ScramSHA1',	cert: fs.readFileSync(lnconfiguration.db.pemfile)	});
//var db 				= mongojs(cloudConnStr, cloudColls, { authMechanism : 'ScramSHA1' });
var db;

var logger = {
	log: function(level, message, metadata, shouldLogToConsole){
		if(shouldLogToConsole){
			console.log("Level:", level);
			console.log("Message:", message);
			if(metadata) console.log(metadata);
		}
		db.logs.insert({level:level, message:message, date: new Date(), metadata:metadata, origin: whoami}, function(err, data){
			if(err){
				console.log("Houston we have a problem");
				console.log(level);
				console.log(message);
				console.log(metadata);
			}
		});
	},
	info: 	function(message, metadata, shouldLogToConsole){ this.log('info', 	message, metadata, shouldLogToConsole); },
	warn: 	function(message, metadata, shouldLogToConsole){ this.log('warn', 	message, metadata, shouldLogToConsole); },
	error:	function(message, metadata, shouldLogToConsole){ this.log('error', 	message, metadata, shouldLogToConsole); }
};

module.exports = function toolsModule(refdb){
	db = refdb;
	mailer = require('../tools/tools.mailer.js')(db);
	var module = {
		mailer					: mailer,
		generateLongString	: generateLongString,
		generateMAC				: generateMAC,
		postHTTPSRequest		: postHTTPSRequest,
		sendHTTPSRequest		: sendHTTPSRequest,
		checkUserToken			: checkUserToken,
		checkToken				: checkToken,
		generateHash			: generateHash,
		compareHash				: compareHash,
		getFormatDate			: getFormatDate,
		jwt						: jwt,
		logger					: logger,
		runLocalCommand		: runLocalCommand,
		whoami					: whoami,
		getSystemSettings		: getSystemSettings,
		getCounter				: getCounter
	};
	return module;
};

function getCounter(name, tokenObject){
	var deferred = Q.defer();
	if(!tokenObject) tokenObject = {};
	getCounterEnsureExists(name).
	then(getCounterIncrement).
	then(function(result){ tokenObject.seq = result; deferred.resolve(tokenObject);}).
	fail(deferred.reject);

	return deferred.promise;
}

function getCounterEnsureExists(name){
	var deferred = Q.defer();
	db.counters.findOne({_id:name}, function(err, counter){
		if(err){
			deferred.reject(err);
		} else if(!counter) {
			db.counters.insert({_id:name, seq:10000000}, function(err, result){
				if(err){
					deferred.reject(err);
				} else {
					deferred.resolve(name);
				}
			});
		} else {
			deferred.resolve(name);
		}
	});
	return deferred.promise;
}

function getCounterIncrement(name){
	var deferred = Q.defer();
	db.counters.findAndModify({ query: { _id: name }, update: { $inc: { seq: 1 } }, new: true }, function(err, result){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(result.seq);
		}
	});
	return deferred.promise;
}

function getSystemSettings(refObj){
	var deferred = Q.defer();
	if(!refObj) refObj = {};
	db.settings.findOne({}, function(err, settings){
		if(err){
			deferred.reject(err);
		} else {
			refObj.systemSettings = settings;
			deferred.resolve(refObj);
		}
	});
	return deferred.promise;
}

function generateLongString(sentLength){
	var length = sentLength || 128,
	charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
	retVal = "";
	for (var i = 0, n = charset.length; i < length; ++i) {
		retVal += charset.charAt(Math.floor(Math.random() * n));
	}
	return retVal;
}

function generateMAC(){
	var deferred = Q.defer();
	var curMac;
	db.ipblocks.find({}, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			var macList = [];
			data.forEach(function(curBlock){
				if(curBlock.ips){
					curBlock.ips.forEach(function(curIP){
						if(curIP.mac) macList.push(curIP.mac);
					});
				}
			});
			while(true){
				var octets = ['52','54','00'];
				var curOctet = '00';
				curMac = '';
				for(var i = 0; i < 3; i++){
					curOctet = Math.floor(Math.random() * (255 - 1) + 1).toString(16).toUpperCase();
					curOctet = '0'+curOctet;
					curOctet = curOctet.substr(curOctet.length - 2);
					octets.push(curOctet);
				}
				curMac = octets.join(":");
				var shouldReturn = true;
				macList.forEach(function(curComp){
					if(curComp == curMac) shouldReturn = false;
				});
				if(shouldReturn) break;
			}
			deferred.resolve(curMac);
		}
	});
	return deferred.promise;
}

function postHTTPSRequest(host, path, port, shouldReject, token, postData){
	var deferred = Q.defer();
	var url = 'https://' + host;
	url += ':' + port || 443;
	url += path || '/';

	//Lets configure and request
	var theObject = {
		url: url,
		rejectUnauthorized:shouldReject || false,
		method: 'POST',
		//Lets post the following key/values as form
		form: postData
	};

	if(token) theObject.headers = {'x-access-token':token};

	request(theObject, function(error, response, body) {
		if (error) {
			deferred.reject(error);
		} else if(response.statusCode > 399){
			deferred.reject(response.statusMessage + '\n' + body);
		} else {
			deferred.resolve(body);
		}
	});
	return deferred.promise;
}

function sendHTTPSRequest(host, path, port, shouldReject, headers, postData){
	var deferred = Q.defer();

	var http = require('https');
	var options = {
		host: host,
		path: path || '/',
		port: port || 443,
		rejectUnauthorized:shouldReject || false
	};


	if(headers){
		options.headers = headers;
	}

	var callback = function(response) {
		var str = '';

		//another chunk of data has been recieved, so append it to `str`
		response.on('data', function(chunk) {
			str += chunk;
		});

		response.on('error', function(e){
			deferred.reject('problem with response: ' + e.message);
		});

		//the whole response has been recieved, so we just print it out here
		response.on('end', function() {
			if( parseInt(parseInt(response.statusCode,10) / 100, 10) > 3){
				deferred.reject('problem with response status: ' + response.statusMessage);
			} else {
				deferred.resolve(str);
			}
		});
	};

	var request = http.request(options, callback);

	request.on('error', function(e) {
	  deferred.reject('problem with request: ' + e.message);
	});

	request.end();

	return deferred.promise;
}

function checkUserToken(req, res, next){
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if(token){
		jwt.verify(token, config.secret, function(err, decoded) {
			if(err){
				return res.json({ status: 'fail', message: 'Failed to authenticate token.' });
			} else {
				req.user = decoded;
				next();
			}
		});
	} else {
		return res.status(401).send({ status: false, message: 'No token provided.' });
	}
}

function checkToken(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (token) {
		jwt.verify(token, config.secret, function(err, decoded) {
			if (err) {
				return res.json({ status: 'fail', message: 'Failed to authenticate token.' });
			} else {
				req.decoded = decoded;
				req.user = decoded;
				db.users.findOne({email:req.decoded.email},function(err, data){
					if(err) { 					return res.json({	status: 'fail',	message: 'Failed to authenticate token. DB error.'}); 	}
					else if(!data){ 			return res.json({	status: 'fail',	message: 'Failed to authenticate token. No user.'}); 	}
					else if(!data.isAdmin){ 	return res.json({	status: 'fail',	message: 'Failed to authenticate token. No admin user.'}); 	}
					else {						next();																						}
				});
			}
		});
	} else {
		return res.status(401).send({ status: false, message: 'No token provided.' });
	}
}

function generateHash(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
}

function compareHash(password, theHash) {
	return bcrypt.compareSync(password, theHash);
}

function getFormatDate(curDate) {
	var toReturn = curDate.getFullYear();
	toReturn += ('0' + (parseInt(curDate.getMonth(), 	10) + 1)).substr(-2);
	toReturn += ('0' + (parseInt(curDate.getDate(), 	10))).substr(-2);
	toReturn += ('0' + (parseInt(curDate.getHours(), 	10))).substr(-2);
	toReturn += ('0' + (parseInt(curDate.getMinutes(), 	10))).substr(-2);
	toReturn += ('0' + (parseInt(curDate.getSeconds(), 	10))).substr(-2);
	return toReturn;
}

function runLocalCommand(command, resolveTo){
	var deferred = Q.defer();
	exec(command, function(error, stdout, stderr){
		if(error){
			console.log("Failed command: ", command);
			deferred.reject(stderr);
		} else {
			if(resolveTo){
				deferred.resolve(resolveTo);
			} else {
				deferred.resolve(stdout);
			}
		}
	});
	return deferred.promise;
}