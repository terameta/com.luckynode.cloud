//var sshClient 	= require('ssh2').Client;
var Q				= require('q');
var tools			= require('../tools/tools.main.js');
var fs 				= require("fs");
var mongojs 		= require('mongojs');
var lnconfiguration	= JSON.parse(fs.readFileSync('luckynode.conf', 'utf8'));
var cloudConnStr	= lnconfiguration.db.user+':'+lnconfiguration.db.pass+'@'+lnconfiguration.db.server+':'+lnconfiguration.db.port+'/'+lnconfiguration.db.database;
var cloudColls		= ['storages', 'nodetokens', 'nodes', 'servers'];
var db 				= mongojs(cloudConnStr, cloudColls, {	authMechanism : 'ScramSHA1' });

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
				data.forEach(function(cPool){
					cPool.id = cPool._id.toString();
				});
				if(node.storage.length == 0){
					data = [{pool:"NoAssignedPoolForTheNode"}];
				}
				var curCommand = { name: 'assignStoragePools', details: data };
				console.log(data);
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
	serverStart: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverStart', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverShutDown: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverShutDown', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverPowerOff: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverPowerOff', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverReboot: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverReboot', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverState: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverState', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverVNCAddress: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverVNCAddress', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	serverResize: function(node, data){
		var deferred = Q.defer();
		var curCommand = { name: 'serverResize', details: data};
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue) { deferred.reject(issue); } );
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
		data.id = data._id.toString();
		var curCommand = { name: 'poolListIsos', details: data };
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	volCloneFromServer: function(node, server, data){
		var deferred = Q.defer();
		console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		console.log("Node\n",node);
		console.log("Server\n",server);
		console.log("Data\n",data);
		console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		var curCommand = { name: 'volCloneFromServer', details: { server: server, target: data} };
		runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		return deferred.promise;
	},
	volDelete: function(node, volume){
		var deferred = Q.defer();
		var curCommand = { name: 'volDelete', details: {volume: volume} };
		console.log(volume);
		if(volume.shouldErase){
			runCommand(node, curCommand).then( function(result){ deferred.resolve(result); } ).fail( function(issue){ deferred.reject(issue); } );
		} else {
			deferred.resolve("Volume delete from the node is not requested.");
		}
		return deferred.promise;
	},
	sendCommandQ: function(nodequery, command, details){
		var deferred = Q.defer();
		sendCommandBase(null, nodequery, command, details).then(deferred.resolve).fail(deferred.reject);
		return deferred.promise;
	},
	sendCommand: function(node, command, details){
		var deferred = Q.defer();
		sendCommandBase(node, null, command, details).then(deferred.resolve).fail(deferred.reject);
		return deferred.promise;
	},
	sendVirshQ : function(nodequery, region, command, details){
		var deferred = Q.defer();
		sendVirshBase(null, nodequery, region, command, details).then(deferred.resolve).fail(deferred.reject);
		return deferred.promise;
	},
	sendVirsh : function(node, region, command, details){
		var deferred = Q.defer();
		sendVirshBase(node, null, region, command, details).then(deferred.resolve).fail(deferred.reject);
		return deferred.promise;
	},
	sendVirshServer : function(server, command, details){
		var deferred = Q.defer();
		db.servers.findOne({_id: mongojs.ObjectId(server)}, function(err, sdata){
			if(err){
				deferred.reject(err);
			} else {
				sendVirshBase(sdata.node, null, 'server', command, details).then(deferred.resolve).fail(deferred.reject);
			}
		});
		return deferred.promise;
	}
};

function sendVirshBase(node, nodequery, region, command, details){
	var deferred = Q.defer();

	if(typeof details.id === "undefined" && typeof details._id !== "undefined"){ details.id = details._id.toString(); }

	var theCommand = { region: region, command: command, details: details};
	runNodeVirsh(node,nodequery, theCommand).then(deferred.resolve).fail(deferred.reject);
	return deferred.promise;
}

function sendCommandBase(node, nodequery, command, details){
	var deferred = Q.defer();
	if(typeof details.id === "undefined" && typeof details._id !== "undefined"){ details.id = details._id.toString(); }

	findNode(node, nodequery).
		then(function(theNode){
			var theCommand = { name: command, details: details};
			runCommand(theNode, theCommand).then(deferred.resolve).fail(deferred.reject);
		}).
		fail(deferred.reject);

	return deferred.promise;
}

function findNode(id, query){
	//console.log("We are in findNode");
	var deferred = Q.defer();

	if(id){
		if( id.id	) { id = id.id; }
		if( id._id	) { id = id._id.toString(); }
	}

	var theQuery = query;
	if(!theQuery && !id){
		deferred.reject("No valid query to findNode");
	} else {
		if(!theQuery) theQuery = {_id:mongojs.ObjectId(id)};
		//console.log("TheQuery", theQuery);
		db.nodes.findOne(theQuery, function(err, data){
			if(err){
				deferred.reject(err);
			} else if(!data){
				deferred.reject('No node found');
			} else {
				//console.log("Node found");
				deferred.resolve(data);
			}
		});
	}
	return deferred.promise;
}

function runNodeVirsh(node, nodequery, command){
	var deferred = Q.defer();
	findNode(node, nodequery).
		then(getTokenN).
		then( function(cNode){ node = cNode; return verifyToken(node, node.token); }).
		then( function(token){ return runNodeVirshRemote(node, token, command); }).
		then( function(result){ deferred.resolve(result); }).
		fail( function(issue){ deferred.reject(issue); });
	return deferred.promise;
}

function runNodeVirshRemote(node, token, command){
	var deferred = Q.defer();
	tools.postHTTPSRequest(node.ip, '/api/command/runVirshCommand', 14413, false, token, {command} ).then(deferred.resolve).fail(deferred.reject);
	return deferred.promise;
}

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

function getTokenN(node){
	var deferred = Q.defer();
	getToken(node._id).then(function(token){
		node.token= token;
		deferred.resolve(node);
	}).fail(deferred.reject);
	return deferred.promise;
}
function getToken(nodeid){
	var deferred = Q.defer();
	//console.log("Getting token");
	//console.log(nodeid);
	//console.log({_id: mongojs.ObjectId(nodeid)});
	db.nodetokens.findOne({_id: mongojs.ObjectId(nodeid)}, function(err, data){
		//console.log("We are in the function at least");
		if(err){
			//console.log("Token issue");
			deferred.reject({ status: "fail", detail: "Cannot access to database", where: "getToken" });
		} else {
			//console.log("No token issue");

			if(data){
				//console.log("We have token");
				deferred.resolve(data.token);
			} else {
				//console.log("We don't have token");
				deferred.resolve('');
			}
		}
	});
	//console.log("Returning deferred for getting token");
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