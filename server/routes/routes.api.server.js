var Q				= require('q');
var topDB 			= '';
var mongojs 		= require('mongojs');
var commander		= require('../tools/tools.node.commander.js');

module.exports = function(app, express, db, tools) {

	var apiRoutes 		= express.Router();
	topDB = db;

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.servers.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.servers.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
			if(err){
				res.status(500).json({status: "fail"});
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res) {
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "server should at least have a name" });
		} else {
			var curNewServer = req.body;
			curNewServer.status = 'defining';
			var curNewServerNode;
			curNewServer.status = 'defining';
			newServerInsert(curNewServer).
				then(function(result){ curNewServer.id = curNewServer._id.toString(); 						return serverFindNode(curNewServer);		}).
				then(function(result){ curNewServerNode = result; curNewServer.bridge = result.netBridge;	return newServerFindIPBlock(curNewServer);	}).
				then(function(result){ 																		return newServerFindImage(curNewServer);	}).
				then(function(result){
					res.send('ok');
					commander.serverDefine(curNewServerNode, curNewServer, function(cerr, cdata){
						if(cerr){
							db.servers.update({_id:mongojs.ObjectId(curNewServer.id)}, {$set: {'status': 'definition failed'}}, function(uerr, udata){
								if(uerr){ console.log("Server status update failed", uerr);}
							});
						} else {
							cdata = JSON.parse(cdata);
							db.servers.update({_id:mongojs.ObjectId(curNewServer.id)}, {$set: {'status': 'Deployed', 'store': cdata.store}}, function(uerr, udata){
								if(uerr){ console.log("Server status update failed", uerr);}
							});
							commander.serverDiskList(curNewServerNode, curNewServer).then(
								function(result){
									result = JSON.parse(result);
									db.servers.update({_id:mongojs.ObjectId(curNewServer.id)}, {$set: {'diskList': result}}, function(uerr, udata){
										if(uerr){ console.log("Server status update failed", uerr);}
									});
								}
							).fail(
								function(issue){
									console.log(issue);
								}
							);
						}
					});
				}).
				fail(function(issue){
					console.log(issue);
					res.status(500).json({status: "fail", message:issue});
				});
		}

	});

	apiRoutes.put('/:id', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body.name ) {
			res.status(400).json({ status: "fail", detail: "server should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "server should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.servers.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
				if( err ){
					res.status(500).json({ status: "fail" });
				} else {
					req.body._id = curid;
					res.send(req.body);
				}
			});
		}
	});

	apiRoutes.delete('/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			var cSrv = {};
			var cNode = {};
			serverFindByID(req.params.id).
				then(function(curSrv){ console.log("Server is found"); cSrv = curSrv;  console.log(cSrv); return serverFindNode(cSrv); } ).
				then(function(curNode){ console.log("Server node is found"); cNode = curNode; return commander.serverDelete(cNode, cSrv); } ).
				then(function(result){ console.log("Remote delete finished"); return serverDelete(cSrv); }).
				then(function(result){ console.log("DB delete finished"); console.log(result); res.json({ status: "success" }); }).
				fail(function(issue){ console.log(issue); res.status(500).json({ status: "fail", message: issue }); });
		}
	});

	apiRoutes.get('/getAvailableISOfiles/:id', tools.checkToken, function(req, res) {
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.servers.findOne({_id:mongojs.ObjectId(req.params.id)}, function(err, data) {
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database for server"});
				} else {
					db.nodes.findOne({_id:mongojs.ObjectId(data.node)}, function(nerr, ndata) {
						if(nerr){
							res.status(500).json({ status: "fail", detail: "Cannot access to database for node"});
						} else {
							db.isofiles.find({status: 'enabled', pool: {$in: ndata.storage}}, function(ierr, idata){
								if(ierr){
									res.status(500).json({ status: "fail", detail: "Cannot access to database for isofiles"});
								} else {
									res.json(idata);
								}
							});
						}
					});
				}
			});
		}
	});

	apiRoutes.get('/ejectISO/:serverid/:target', tools.checkToken, function(req, res) {
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.serverid || !req.params.target){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.servers.findOne({_id: mongojs.ObjectId(req.params.serverid)}, function(serr, sdata){
				if(serr){
					res.status(500).json({ status: "fail", detail: "Cannot access to database for servers"});
				} else if(!sdata) {
					res.status(500).json({ status: "fail", detail: "Cannot find the server with the given id"});
				} else {
					db.nodes.findOne({_id: mongojs.ObjectId(sdata.node)}, function(nerr, ndata){
						if(nerr){
							res.status(500).json({ status: "fail", detail: "Cannot access to database for nodes"});
						}else if(!ndata){
							res.status(500).json({ status: "fail", detail: "Cannot find the node with the given id of the server"});
						} else {
							commander.serverEjectISO(ndata, {target: req.params.target, server: req.params.serverid}).then(function(result){
								console.log("Success:",result);
							}).fail(function(issue){
								console.log("issue:",issue);
							});
						}
					});
				}
			});
		}
		res.send("OK");
	});

	apiRoutes.get('/attachISO/:id/:serverid/:target', tools.checkToken, function(req, res) {
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.serverid){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.target){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.isofiles.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database for isofiles"});
				} else if(!data){
					res.status(500).json({ status: "fail", detail: "Cannot find the isofile with the given id"});
				} else {
					db.servers.findOne({_id: mongojs.ObjectId(req.params.serverid)}, function(serr, sdata){
						if(serr){
							res.status(500).json({ status: "fail", detail: "Cannot access to database for servers"});
						}else if(!sdata){
							res.status(500).json({ status: "fail", detail: "Cannot find the server with the given id"});
						} else {
							db.nodes.findOne({_id: mongojs.ObjectId(sdata.node)}, function(nerr, ndata){
								if(nerr){
									res.status(500).json({ status: "fail", detail: "Cannot access to database for nodes"});
								}else if(!ndata){
									res.status(500).json({ status: "fail", detail: "Cannot find the node with the given id of the server"});
								} else {
									db.storages.findOne({_id: mongojs.ObjectId(data.pool)}, function(perr, pdata){
										if(perr){
											res.status(500).json({ status: "fail", detail: "Cannot access to database for storages"});
										} else if(!pdata){
											res.status(500).json({ status: "fail", detail: "Cannot find the storage with the given id of the isofile"});
										} else {
											sdata.id = sdata._id.toString();
											var commandData = {
												iso: data.file,
												pool: pdata.name,
												server: sdata.id,
												target: req.params.target
											};
											//console.log(pdata);
											commander.serverAttachISO(ndata, commandData).then(function(result){
												res.send(result);
											}).fail(function(issue){
												res.status(500).json({ status: "fail", detail: issue});
											});
										}
									});
								}
							});

						}
					});
				}
			});
		}
	});

	apiRoutes.get('/listAttachedDisks/:id', tools.checkToken, function(req, res) {
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.servers.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data) {
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database for servers"});
				} else if(!data){
					res.status(400).json({ status: "fail", detail: "Cannot find the server with the given id"});
				} else {
					db.nodes.findOne({_id: mongojs.ObjectId(data.node)}, function(nerr, ndata) {
						if(nerr){
							res.status(500).json({ status: "fail", detail: "Cannot access to database for nodes"});
						} else if(!ndata){
							res.status(400).json({ status: "fail", detail: "Cannot find the node for the server with the given id"});
						} else {
							//console.log(ndata);
							data.id = data._id.toString();
							commander.serverDiskList(ndata, data).then(function(result){
								result = JSON.parse(result);
								res.json(result);
								console.log(result);
								db.servers.update({_id:mongojs.ObjectId(req.params.id)}, {$set: {diskList: result}}, function(uerr, udata) {
									if(uerr){
										console.log("Update issue:", uerr);
									}
								});
							}).fail(function(issue) {
								res.status(500).json({ status: "fail", detail: "Failed to fetch disklist from node"});
							});
						}
					});
				}
			});
		}
		//commander.serverDiskList();
	});

	app.use('/api/server', apiRoutes);
};

function newServerInsert(curSrv){
	var deferred = Q.defer();
	topDB.servers.insert(curSrv, function(err, data) {
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function serverDelete(cSrv){
	var deferred = Q.defer();
	topDB.servers.remove({_id:mongojs.ObjectId(cSrv._id)}, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve("Delete completed: " + data.toString());
		}
	});
	return deferred.promise;
}

function serverFindByID(id){
	var deferred = Q.defer();
	topDB.servers.findOne({_id:mongojs.ObjectId(id)}, function(err, data){
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

function serverFindNode(curSrv){
	var deferred = Q.defer();
	topDB.nodes.findOne({_id:mongojs.ObjectId(curSrv.node)}, function(err, data){
		if(err){
			deferred.reject(err);
		} else if(!data){
			deferred.reject('No node found');
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function newServerFindIPBlock(curSrv){
	var deferred = Q.defer();
	topDB.ipblocks.findOne({ips: {$elemMatch: { ip: curSrv.ip}}}, function(err, data){
		if(err){
			deferred.reject(err);
		} else if(!data){
			deferred.reject('No IP block found');
		} else {
			if(data.ips){
				data.ips.forEach(function(curMAC) {
					if (curMAC.mac && curMAC.ip == curSrv.ip) curSrv.mac = curMAC.mac;
				});
			}
			curSrv.gateway = data.gateway;
			curSrv.netmask = data.netmask;
			curSrv.nameserver1 = data.nameserver1;
			curSrv.nameserver2 = data.nameserver2;
			deferred.resolve();
		}
	});
	return deferred.promise;
}

function newServerFindImage(curSrv){
	var deferred = Q.defer();
	if(curSrv.image){
		topDB.images.findOne({_id:mongojs.ObjectId(curSrv.image)},function(err, data){
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
				topDB.storages.findOne({_id:mongojs.ObjectId(data.pool)}, function(serr, sdata){
					if(serr){
						deferred.reject(serr);
					} else if(!sdata){
						deferred.reject('No pool found for the defined image.');
					} else {
						curSrv.store = sdata.name;
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