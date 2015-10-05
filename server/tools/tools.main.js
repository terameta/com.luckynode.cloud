var bcrypt   		= require('bcrypt-nodejs');
var jwt				= require('jsonwebtoken');
var config 			= require('../config/config.main.js');
var Q				= require('q');
var request 		= require('request');
var mongojs 		= require('mongojs');
var exec 			= require('child_process').exec;
var fs 				= require("fs");
var lnconfiguration	= JSON.parse(fs.readFileSync('luckynode.conf', 'utf8'));
var cloudConnStr	= lnconfiguration.db.user+':'+lnconfiguration.db.pass+'@'+lnconfiguration.db.server+':'+lnconfiguration.db.port+'/'+lnconfiguration.db.database;
var cloudColls		= ['users'];
var db 				= mongojs(cloudConnStr, cloudColls, {	ssl: true,    authMechanism : 'ScramSHA1',	cert: fs.readFileSync(lnconfiguration.db.pemfile)	});

module.exports = {
	generateLongString : function(sentLength){
		var length = sentLength || 128,
		charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		retVal = "";
		for (var i = 0, n = charset.length; i < length; ++i) {
			retVal += charset.charAt(Math.floor(Math.random() * n));
		}
		return retVal;
	},
	postHTTPSRequest: function(host, path, port, shouldReject, token, postData){
		var deferred = Q.defer();
		var url = 'https://' + host;
		url += ':' + port || 443;
		url += path || '/';

		//Lets configure and request
		request({
			url: url,
			rejectUnauthorized:shouldReject || false,
			headers: {'x-access-token':token},
			method: 'POST',
			//Lets post the following key/values as form
			form: postData
		}, function(error, response, body) {
			if (error) {
				deferred.reject(error);
			} else if(response.statusCode > 399){
				deferred.reject(response.statusMessage + '\n' + body);
			} else {
				deferred.resolve(body);
			}
		});
		return deferred.promise;
	},

	sendHTTPSRequest: function sendHTTPSRequest(host, path, port, shouldReject, headers, postData){
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
	},
	checkToken : function (req, res, next) {
		var token = req.body.token || req.query.token || req.headers['x-access-token'];
		if (token) {
			jwt.verify(token, config.secret, function(err, decoded) {
				if (err) {
					return res.json({
						status: 'fail',
						message: 'Failed to authenticate token.'
					});
				}
				else {
					req.decoded = decoded;
					db.users.findOne({email:req.decoded},function(err, data){
						if(err) { 					return res.json({	status: 'fail',	message: 'Failed to authenticate token. DB error.'}); 	}
						else if(!data){ 			return res.json({	status: 'fail',	message: 'Failed to authenticate token. No user.'}); 	}
						else if(!data.isAdmin){ 	return res.json({	status: 'fail',	message: 'Failed to authenticate token. No admin user.'}); 	}
						else {						next();																						}
					});
				}
			});
		} else {
			return res.status(401).send({
				status: false,
				message: 'No token provided.'
			});

		}
	},
	generateHash : function(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
	},compareHash : function(password, theHash) {
		return bcrypt.compareSync(password, theHash);
	},getFormatDate : function(curDate) {
		var toReturn = curDate.getFullYear();
		toReturn += ('0' + (parseInt(curDate.getMonth()) + 1)).substr(-2);
		toReturn += ('0' + (parseInt(curDate.getDate()))).substr(-2);
		toReturn += ('0' + (parseInt(curDate.getHours()))).substr(-2);
		toReturn += ('0' + (parseInt(curDate.getMinutes()))).substr(-2);
		toReturn += ('0' + (parseInt(curDate.getSeconds()))).substr(-2);
		return toReturn;
	},
	jwt : jwt,
	runLocalCommand:runLocalCommand

};

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
