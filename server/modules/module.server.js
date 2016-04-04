var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var commander;

module.exports = function(refdb){
	db 			= refdb;
	commander 	= require('../tools/tools.node.commander.js')(db);
	var module = {
		deleteServer: undefine,
		undefine: undefine,
		listServers: listServers,
		findServer: findServer,
		state: state,
		persistentInitiateVNCProxy: persistentInitiateVNCProxy,
		update: update,
		insertToDB: insertToDB,
		deleteFromDB: deleteFromDB,
		findByID: findByID,
		findNode: findNode,
		findMostFreeNode: findMostFreeNode,
		reserveIP: reserveIP,
		releaseIP: releaseIP,
		assignIP: assignIP,
		findIPBlock: findIPBlock,
		findImage: findImage,
		verifyowner:verifyowner
	};
	return module;
};

function undefine(id){
	var deferred = Q.defer();
	commander.sendVirshServer(id, 'undefine', {id:id}).
		then(deleteFromDB).
		then(deferred.resolve).
		fail(deferred.reject);
	return deferred.promise;
}

function verifyowner(id, ownerid){
	var deferred = Q.defer();
	db.servers.findOne({_id:mongojs.ObjectId(id), owner:ownerid}, function(err, data) {
		if(err){
			deferred.reject(err);
		} else if(data.length == 0){
			deferred.reject("Not owner");
		} else {
			deferred.resolve("OK");
		}
	});
	return deferred.promise;
}

function state(query){
	var deferred = Q.defer();
	db.servers.findOne(query, {domstate:1, _id:0}, function(err, data){
		if(err){
			deferred.reject({ status: "fail", detail: "Cannot access to database for servers"});
		} else if(!data) {
			deferred.reject({ status: "fail", detail: "Cannot find the server with the given id"});
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function findServer(query){
	var deferred = Q.defer();
	if(!query) query = {doesntexist:'1'};
	db.servers.findOne(query, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function listServers(query){
	var deferred = Q.defer();
	if(!query) query = {};
	db.servers.find(query, function(err, data) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function persistentInitiateVNCProxy(host, port, localport, tools){
	var deferred = Q.defer();
	var curCommand = path.resolve('.') + '/client/lib/no-vnc/utils/websockify '+localport+' '+ host +':'+ port +' --cert /etc/nginx/ssl/www_epmvirtual_com.crt --key /etc/nginx/ssl/www_epmvirtual_com.key --ssl-only -D --run-once --timeout=60';
	tools.runLocalCommand(curCommand).then(function(result){
		deferred.resolve(localport);
	}).fail(function(issue){
		if(issue.indexOf("socket.error: [Errno 98] Address already in use") >= 0){
			++localport;
			persistentInitiateVNCProxy(host, port, localport, tools).then(deferred.resolve).fail(deferred.reject);
		} else {
			deferred.reject(issue);
		}
	});
	return deferred.promise;
}

function update(curSrv){
	var deferred = Q.defer();
	console.log("Finding curid");
	reserveIP(curSrv).
		then(function(result){
			var curid = curSrv._id;
			delete curSrv._id;
			db.servers.update({_id: mongojs.ObjectId(curid)}, curSrv, function(err, data){
				if( err ){
					curSrv._id = curid;
					deferred.reject(err);
				} else {
					curSrv._id = curid;
					deferred.resolve(curSrv);
				}
			});
		}).
		fail(function(issue){ deferred.reject(issue); });
	return deferred.promise;
}

function insertToDB(curSrv){
	var deferred = Q.defer();
	db.servers.insert(curSrv, function(err, data) {
		if(err){
			deferred.reject(err);
		} else {
			data.id = data._id.toString();
			console.log("Server is inserted to Database", data.id);
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function deleteFromDB(cSrv){
	var deferred = Q.defer();
	if(typeof cSrv != 'object') cSrv = JSON.parse(cSrv);
	console.log(cSrv, typeof cSrv);
	if(!cSrv._id) cSrv._id = cSrv.id;
	findByID(cSrv.id).
		then(releaseIP).then(function(result){
			db.servers.remove({_id:mongojs.ObjectId(cSrv._id)}, function(err, data){
				if(err){
					deferred.reject(err);
				} else {
					deferred.resolve("Delete completed: " + data.toString());
				}
			});
		}).fail(function(issue){
			deferred.reject(issue);
		});
	return deferred.promise;
}

function findByID(id){
	var deferred = Q.defer();
	console.log("****************",id,"*****************");
	db.servers.findOne({_id:mongojs.ObjectId(id)}, function(err, data){
		if(err){
			deferred.reject(err);
		} else if(!data){
			deferred.reject('No server found');
		} else {
			data.id = data._id.toString();
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function findNode(curSrv){
	console.log("Finding server node for ", curSrv.id, curSrv.node);
	var deferred = Q.defer();

			db.nodes.findOne({_id:mongojs.ObjectId(curSrv.node)}, function(err, data){
				if(err){
					deferred.reject(err);
				} else if(!data){
					deferred.reject('No node found');
				} else {
					//curSrv.nodeObject = data;
					curSrv.bridge = data.netBridge;
					deferred.resolve(curSrv);
				}
			});

	return deferred.promise;
}

function findMostFreeNode(curSrv){
	console.log("serverFindMostFreeNode", curSrv.node);
	var deferred = Q.defer();
	if(curSrv.node != 'AUTO'){
		deferred.resolve(curSrv);
		console.log("returning self of curSrv");
		return deferred.promise;
	}
	db.nodes.find({}, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			//deferred.resolve(data);
			var minMemUsage = 100;
			var minMemNode = '';
			var curMinNode = {
				name:"DontAssignMeEverThisIsANameThatShouldNeverBeAssigned3835213545685443215698455",
				stats: {
					cpuCount:0,
					cpuUsage:1000,
					memTotal:0,
					memUsage:1000,
					assignedCores:1000,
					assignedMemory:1024*1024*1024,
					assignedServers:1000
				}
			};
			data.forEach(function(curNode){
				if(curNode.stats.cpuCount >= curSrv.cpu && curNode.stats.memTotal >= curSrv.ram){
					if(curNode.stats.assignedMemory < curMinNode.stats.assignedMemory){
						curMinNode = curNode;
					} else if(curNode.stats.assignedMemory == curMinNode.stats.assignedMemory){
						if(curNode.stats.assignedCores < curMinNode.stats.assignedCores){
							curMinNode = curNode;
						} else if(curNode.stats.assignedCores == curMinNode.stats.assignedCores){
							if(curNode.stats.assignedServers < curMinNode.stats.assignedServers){
								curMinNode = curNode;
							}
						}
					}
				}

				if(curNode.stats.memUsage < minMemUsage) minMemNode = curNode._id.toString();
			});
			if(curMinNode.name == "DontAssignMeEverThisIsANameThatShouldNeverBeAssigned3835213545685443215698455"){
				deferred.reject("No nodes are available for assignmentn");
			} else {
				curSrv.node = curMinNode._id.toString();
				console.log("Selected Node:", curSrv.node, curMinNode.name);
				deferred.resolve(curSrv);
			}
		}
	});
	return deferred.promise;
}

function reserveIP(curSrv){
	var deferred = Q.defer();
	db.ipblocks.findOne({_id: mongojs.ObjectId(curSrv.ipblock)}, function(err, data){
		if(err){
			console.log("Database connection is failed for IPBlock");
			deferred.reject(err);
		} else if(!data){
			deferred.reject('No IP block found');
		} else {
			if(data.ips){
				data.ips.forEach(function(curIP) {
					if(curIP.ip == curSrv.ip) curIP.reserved = curSrv._id;
					//if(curIP.ip != curSrv.ip && curIP.reserved != curSrv._id) delete curIP.reserved;
				});
			}
			delete data._id;
			db.ipblocks.update({_id: mongojs.ObjectId(curSrv.ipblock)}, data, function(err, data){
				if(err){
					deferred.reject(err);
				} else {
					deferred.resolve(curSrv);
				}
			});
		}
	});
	return deferred.promise;
}

function releaseIP(curSrv){
	var deferred = Q.defer();
	db.ipblocks.findOne({_id: mongojs.ObjectId(curSrv.ipblock)}, function(err, data){
		if(err){
			console.log("Database connection is failed for IPBlock");
			deferred.reject(err);
		} else if(!data){
			deferred.reject('No IP block found');
		} else {
			console.log("IP Block found", data.ips);
			if(data.ips){
				console.log(data.ips);
				data.ips.forEach(function(curIP) {
					console.log("Before Delete:", curIP);
					if(curIP.ip == curSrv.ip) delete curIP.reserved;
					console.log("After Delete:", curIP);
				});
			}
			delete data._id;
			db.ipblocks.update({_id: mongojs.ObjectId(curSrv.ipblock)}, data, function(err, data){
				if(err){
					deferred.reject(err);
				} else {
					deferred.resolve(curSrv);
				}
			});
		}
	});
	return deferred.promise;
}

function assignIP(curSrv){
	//console.log("Assign IP", curSrv.dc, curSrv.ip);
	if(curSrv.dc){
		if(!curSrv.dc._id) curSrv.dc = { _id: curSrv.dc};
	}
	var deferred = Q.defer();
	if(curSrv.ip != 'AUTO'){
		deferred.resolve(curSrv);
		return deferred.promise;
	}

	//console.log(curSrv.ip)

	db.ipblocks.find({dcs: {$elemMatch: { $eq: curSrv.dc._id}}}, function(err, blocks){
		if(err){
			console.log("there is an issue with assigning IP address", curSrv.id);
			deferred.reject(err);
		} else {
			var selectedIP = false;
			console.log("==============================================================");
			for(var i = 0; i < blocks.length; i++){
				for(var t = 0; t < blocks[i].ips.length; t++){
					//console.log(blocks[i].ips[t]);
					if(!blocks[i].ips[t].reserved) selectedIP = blocks[i].ips[t];
					if(selectedIP) break;
				}
				if(selectedIP) break;
			}
			console.log("Selected IP", selectedIP.ip);
			curSrv.ip = selectedIP.ip;
		}
		if(curSrv.ip == 'AUTO'){
			deferred.reject("There are no free IP addresses");
		} else {
			deferred.resolve(curSrv);
		}
	});

	return deferred.promise;
}

function findIPBlock(curSrv){
	var deferred = Q.defer();
	db.ipblocks.findOne({ips: {$elemMatch: { ip: curSrv.ip}}}, function(err, data){
		if(err){
			console.log("Database connection is failed for IPBlock");
			deferred.reject(err);
		} else if(!data){
			deferred.reject('No IP block found');
		} else {
			if(data.ips){
				data.ips.forEach(function(curMAC) {
					if (curMAC.mac && curMAC.ip == curSrv.ip) curSrv.mac = curMAC.mac;
				});
			}
			curSrv.ipblock = data._id;
			curSrv.gateway = data.gateway;
			curSrv.netmask = data.netmask;
			curSrv.nameserver1 = data.nameserver1;
			curSrv.nameserver2 = data.nameserver2;
			deferred.resolve(curSrv);
		}
	});
	return deferred.promise;
}

function findImage(curSrv){
	console.log("FindImage", curSrv.id, curSrv.image, curSrv.img);
	var deferred = Q.defer();
	if(curSrv.image){
		db.images.findOne({_id:mongojs.ObjectId(curSrv.image)},function(err, data){
			if(err){
				deferred.reject(err);
			} else if(!data){
				deferred.reject('No image found');
			} else {
				curSrv.architecture = data.architecture;
				curSrv.diskdriver = data.diskdriver;
				curSrv.netdriver = data.netdriver;
				curSrv.baseImage = data.basefile;
				curSrv.imageType = data.imagetype;
				db.storages.findOne({_id:mongojs.ObjectId(data.pool)}, function(serr, sdata){
					if(serr){
						deferred.reject(serr);
					} else if(!sdata){
						deferred.reject('No pool found for the defined image.');
					} else {
						curSrv.store = sdata.name;
						curSrv.storeid = sdata._id.toString();
						deferred.resolve();
					}
				});
			}
		});
	} else {
		curSrv.baseImage = 'CreateNew';
		var shouldResolve = true;
		var issue = '';
		if(curSrv.diskdriver != 'virtio' && curSrv.diskdriver != 'ide'){
			shouldResolve = false;
			issue = 'Disk driver missing.';
		}
		if(curSrv.netdriver != 'virtio' && curSrv.netdriver != 'rtl8139' && curSrv.netdriver != 'e1000'){
			shouldResolve = false;
			issue += 'Network driver missing.';
		}
		if(shouldResolve){
			deferred.resolve();
		} else {
			deferred.reject(issue);
		}
	}
	return deferred.promise;
}