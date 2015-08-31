//var sshClient 	= require('ssh2').Client;
var Q				= require('q');
var tools			= require('../tools/tools.main.js');
var mongojs			= require('mongojs');
var db = {};
    db.nodetokens	= mongojs('cloud',['nodetokens']).nodetokens;
    db.storages		= mongojs('cloud',['storages']).storages;

module.exports = {
	assignStoragePools: function(node){
		//console.log(node);
		var storages = [];
		node.storage.forEach(function(curStorage){
			console.log("curStorage: ", curStorage);
			storages.push(mongojs.ObjectId(curStorage));
		});
		db.storages.find({_id:{$in:storages}}, function(err, data){
			if(err){
				console.log(err);
			} else {
				var curCommand = { name: 'assignStoragePools', details: data };
				runCommand(node, curCommand).then(	function(result) { console.log("Deferred Result: ", result); } ).fail( function(issue) { console.log("Deferred Issue: ", issue); } );
			}
		});
	},
	defineNetworkBridge: function(node, ip, callback){
		var data = {ip: ip};
		var curCommand = { name: 'definenetworkbridge', details: data };
		runCommand(node, curCommand).then(	function(result) { callback(null, result); } ).fail( function(issue) { callback(issue, null); } );
	},
	serverDefine: function(node, data, callback){
		var curCommand = { name: 'serverDefine', details: data};
		runCommand(node, curCommand).then( function(result){ callback(null, result); } ).fail( function(issue){ callback(issue, null); } );
	},
	serverDelete: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverDelete', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverDiskList: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverDiskList', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverAttachISO: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverAttachISO', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverEjectISO: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverEjectISO', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	nodeInterfaceList: function(node){
		var deferred = Q.defer();
		var data = { myrequest: 'listofinterfaces' };
		var curCommand = { name: 'nodeInterfaceList', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	nodeBridgeAssign: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'nodeBridgeAssign', details: data };
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	nodeBridgeDetach: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'nodeBridgeDetach', details: data };
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	poolListIsos: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'poolListIsos', details: data };
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	}
};

function runCommand(node, command){
	var deferred = Q.defer();
	getToken(node._id).
		then( function(token){ return verifyToken(node, token); }).
		then( function(token){ return runRemoteCommand(node, token, command); }).
		then( function(result){ deferred.resolve(result); }).
		fail( function(issue){ deferred.reject(issue); });
	return deferred.promise;
}

function runRemoteCommand(node, token, command){
	var deferred = Q.defer();
	tools.postHTTPSRequest(node.ip, '/api/command/'+command.name, 14413, false, token, {details: command.details} ).then(
		function(result){
			//console.log("Remote command is run");
			//console.log(result);
			deferred.resolve(result);}
	).fail(
		function(issue){ deferred.reject(issue);}
	);
	return deferred.promise;
}

function getToken(nodeid){
	var deferred = Q.defer();
	db.nodetokens.findOne({_id: mongojs.ObjectId(nodeid)}, function(err, data){
		if(err){
			deferred.reject({ status: "fail", detail: "Cannot access to database", where: "getToken" });
		} else {
			if(data){
				deferred.resolve(data.token);
			} else {
				deferred.resolve('');
			}
		}
	});
	return deferred.promise;
}

function verifyToken(node, token){
	var deferred = Q.defer();
	tools.sendHTTPSRequest(node.ip, '/api/verifytoken', 14413, false, {'x-access-token':token}).then(
		function(result){
			deferred.resolve(token);
		}
	).fail(
		function(issue){
			tools.sendHTTPSRequest(node.ip, '/api/authenticate', 14413, false).then(
				function(authresult){
					var token = JSON.parse(authresult).token;
					db.nodetokens.update({ _id: mongojs.ObjectId(node._id) }, {token: token}, { upsert: true }, function(err, data) {
						if(err){
							deferred.reject(err);
						} else {
							deferred.resolve(token);
						}
					});
				}
			).fail(
				function(authissue){
					deferred.reject(authissue);
				}
			);
		}
	);
	return deferred.promise;
}