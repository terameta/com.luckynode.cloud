var Q					= require('q');
var topDB 			= '';
var mongojs 		= require('mongojs');
var commander;
var path 			= require('path');

module.exports = function(app, express, db, tools) {
	commander 	= require('../tools/tools.node.commander.js')(db);
	var serverModule 	= require('../modules/module.server.js')(db);

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

	apiRoutes.get('/whatismypassword', function(req, res){
		isThisOurServer(req);
		res.send("OK");
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
			curNewServer.owner = req.user.id;
			newServerInsert(curNewServer).
				then(serverAssignIP).
				then(serverModule.findMostFreeNode).
				then(function(result){ curNewServer.id = curNewServer._id.toString(); 								return serverFindNode(curNewServer);			}).
				then(function(result){ curNewServerNode = result; curNewServer.bridge = result.netBridge;		return serverFindIPBlock(curNewServer);		}).
				then(function(result){																								return serverUpdate(curNewServer);				}).
				then(function(result){																								return serverReserveIP(curNewServer);			}).
				then(function(result){ 																								return serverFindImage(curNewServer);			}).
				then(function(result){
					res.send(curNewServer);
					console.log("CurNewServerNode");
					commander.sendVirsh(curNewServerNode, 'server', 'define', curNewServer);
					console.log(curNewServerNode);
					/*
					commander.serverDefine(curNewServerNode, curNewServer, function(cerr, cdata){
						if(cerr){
							console.log("serverDefine failed");
							console.log(cdata);
							console.log(cerr);
							db.servers.update({_id:mongojs.ObjectId(curNewServer.id)}, {$set: {'status': 'definition failed'}}, function(uerr, udata){
								if(uerr){ console.log("Server status update failed", uerr);}
							});
						} else {
							cdata = JSON.parse(cdata);
							console.log(cdata);
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
					*/
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
			console.log(req.body);
			serverFindIPBlock(req.body).
				then(function(result){ 						return serverUpdate(result);		}).
				then(function(result){
					res.send(result);
				}).fail(function(issue){
					console.log(issue);
					res.status(500).json({ status: "fail", message: issue });
				});
		}
	});

	apiRoutes.delete('/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			serverModule.deleteServer(req.params.id).
				then(function(result){
					console.log("node server delete success", result);
					res.json({status: "success"});
				}).fail(function(issue){
					console.log(issue);
					res.status(500).json({ status: "fail", message: issue });
				});
			/*commander.sendVirshServer(req.params.id, 'undefine', {id:req.params.id}).
				then(serverDeleteFromDB).
				then(function(result){
					console.log("node server delete success", result);
					res.json({status: "success"});
				}).fail(function(issue){
					console.log(issue);
					res.status(500).json({ status: "fail", message: issue });
				});
				*/
		}
	});

	apiRoutes.get('/startConsoleOnTheServer/:id', tools.checkToken, function(req, res) {
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.servers.findOne({_id: mongojs.ObjectId(req.params.id)}, function(serr, sdata){
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
							sdata.id = sdata._id.toString();
							commander.sendVirshServer(req.params.id, 'vncAddress', {id: req.params.id}).then(function(cSrv){
							//commander.serverVNCAddress(ndata, sdata).then(function(cSrv){
								cSrv = JSON.parse(cSrv);
								console.log("Before persistant:", cSrv);
								if(cSrv.vncport == -1){
									res.status(500).json({ status: "fail", detail: 'Server is not running. Please start the server first.'});
								} else {
									console.log("We are initiating persin");
									persistentInitiateVNCProxy(ndata.ip, cSrv.vncport, 6783, tools).then(function(result){
										res.json({port:result});
									}).fail(function(issue){
										res.status(400).json({ status: "fail", detail: issue});
									});
								}
							}).fail(function(issue){
								console.log("Hedere");
								res.status(500).json({ status: "fail", detail: issue});
							});
						}
					});
				}
			});
		}
	});

	apiRoutes.get('/serverState/:id', tools.checkToken, function(req, res) {
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.servers.findOne({_id: mongojs.ObjectId(req.params.id)}, function(serr, sdata){
				if(serr){
					res.status(500).json({ status: "fail", detail: "Cannot access to database for servers"});
				} else if(!sdata) {
					res.status(500).json({ status: "fail", detail: "Cannot find the server with the given id"});
				} else {
					res.send(sdata);
				}
			});
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
							db.isofiles.find({status: {$ne:'disabled'}, pool: {$in: ndata.storage}}, function(ierr, idata){
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
											pdata.id = pdata._id.toString();
											var commandData = {
												iso: data.file,
												pool: pdata.id,
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
								//console.log(result);
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

	apiRoutes.get('/serverResize/:id', tools.checkToken, function(req, res){
		db.servers.findOne({_id: mongojs.ObjectId(req.params.id)}, function(serr, sdata) {
			if(serr){
				res.status(500).json({ status: "fail", detail: "Cannot access to database for servers"});
			} else if(!sdata) {
				res.status(500).json({ status: "fail", detail: "Cannot find the server with the given id"});
			} else {
				db.nodes.findOne({_id: mongojs.ObjectId(sdata.node)}, function(nerr, ndata){
					if(nerr){
						res.status(500).json({ status: "fail", detail: "Cannot access to database for nodes"});
					} else if(!ndata){
						res.status(500).json({ status: "fail", detail: "Cannot find the node with the given id of the server"});
					} else {
						sdata.id = sdata._id.toString();
						commander.serverResize(ndata, sdata).then(function(result){
							res.json(JSON.parse(result));
						}).fail(function(issue){
							res.status(500).json({ status: "fail", detail: issue});
						});
					}
				})
			}
		});
	});

	apiRoutes.post('/converged', tools.checkToken,function(req, res) {
		//console.log(req.body);
		if(!req.body){
			res.status(400).json({status: 'fail', message: 'Not enough data (nothing provided)'});
		} else if(!req.body.id){
			res.status(400).json({status: 'fail', message: 'Not enough data (no id provided)'});
		} else if(!req.body.command){
			res.status(400).json({status: 'fail', message: 'Not enough data (no command provided)'});
		} else {
			commander.sendVirshServer(req.body.id, req.body.command, req.body.details).then(function(result){
				res.send(result);
			}).fail(function(issue){
				console.log(issue);
				res.status(500).json(issue);
			});
		}

	});

	app.use('/api/server', apiRoutes);
};

function isThisOurServer(theReq){
	var ip = theReq.headers['x-forwarded-for'] || theReq.connection.remoteAddress || theReq.socket.remoteAddress || theReq.connection.socket.remoteAddress;
	ip = ip.replace("::ffff:", "");
	ip = ip.replace("::FFFF:", "");

	var deferred = Q.defer();
	var isThisOurSrv = false;
	topDB.servers.find({}, function(err, servers){
		if(err){
			deferred.reject("can't connect to database.");
		} else {
			servers.forEach(function(curServer){
				console.log(curServer.ip, ip);
				if(curServer.ip == ip) isThisOurSrv = true;
			});
			if(isThisOurSrv){
				deferred.resolve();
			} else {
				deferred.reject();
			}
		}
	});

	return deferred.promise;
}

function persistentInitiateVNCProxy(host, port, localport, tools){
	var deferred = Q.defer();
	var curCommand = path.resolve('.') + '/client/lib/no-vnc/utils/websockify '+localport+' '+ host +':'+ port +' --cert /etc/nginx/ssl/www_epmvirtual_com.crt --key /etc/nginx/ssl/www_epmvirtual_com.key --ssl-only -D --run-once --timeout=60';
	tools.runLocalCommand(curCommand).then(function(result){
		console.log("==========================================================");
		console.log("==========================================================");
		console.log(result);
		console.log("==========================================================");
		console.log("==========================================================");
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

function serverUpdate(curSrv){
	console.log(curSrv);
	var deferred = Q.defer();
	console.log("Finding curid");
	serverReserveIP(curSrv).
		then(function(result){
			var curid = curSrv._id;
			delete curSrv._id;
			topDB.servers.update({_id: mongojs.ObjectId(curid)}, curSrv, function(err, data){
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

function serverDeleteFromDB(cSrv){
	var deferred = Q.defer();
	if(typeof cSrv != 'object') cSrv = JSON.parse(cSrv);
	console.log(cSrv, typeof cSrv);
	if(!cSrv._id) cSrv._id = cSrv.id;
	serverFindByID(cSrv.id).
		then(serverReleaseIP).then(function(result){
			topDB.servers.remove({_id:mongojs.ObjectId(cSrv._id)}, function(err, data){
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

function serverFindByID(id){
	var deferred = Q.defer();
	console.log("****************",id,"*****************");
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
	console.log("Finding server node for "+ curSrv, curSrv.node);
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

function serverFindMostFreeNode(curSrv){
	console.log("serverFindMostFreeNode", curSrv);
	var deferred = Q.defer();
	if(curSrv.node != 'AUTO'){
		deferred.resolve(curSrv);
		console.log("returning self of curSrv");
		return deferred.promise;
	}
	topDB.nodes.find({}, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(data);
			var minMemUsage = 100;
			var minMemNode = '';
			data.forEach(function(curNode){
				if(curNode.stats.memUsage < minMemUsage) minMemNode = curNode._id.toString();
			});
			curSrv.node = minMemNode;
			deferred.resolve(curSrv);
		}
	});
	return deferred.promise;
}

function serverReserveIP(curSrv){
	var deferred = Q.defer();
	topDB.ipblocks.findOne({_id: mongojs.ObjectId(curSrv.ipblock)}, function(err, data){
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
			topDB.ipblocks.update({_id: mongojs.ObjectId(curSrv.ipblock)}, data, function(err, data){
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

function serverReleaseIP(curSrv){
	var deferred = Q.defer();
	topDB.ipblocks.findOne({_id: mongojs.ObjectId(curSrv.ipblock)}, function(err, data){
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
			topDB.ipblocks.update({_id: mongojs.ObjectId(curSrv.ipblock)}, data, function(err, data){
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

function serverAssignIP(curSrv){
	var deferred = Q.defer();
	if(curSrv.ip != 'AUTO'){
		deferred.resolve(curSrv);
		return deferred.promise;
	}

	topDB.ipblocks.find({dcs: {$elemMatch: { $eq: curSrv.dc._id}}}, function(err, blocks){
		if(err){
			deferred.reject(err);
		} else {
			var selectedIP = false;
			console.log("==============================================================");
			for(var i = 0; i < blocks.length; i++){
				for(var t = 0; t < blocks[i].ips.length; t++){
					console.log(blocks[i].ips[t]);
					if(!blocks[i].ips[t].reserved) selectedIP = blocks[i].ips[t];
					if(selectedIP) break;
				}
				if(selectedIP) break;
			}
			console.log("SelectIP", selectedIP);
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

function serverFindIPBlock(curSrv){
	var deferred = Q.defer();
	topDB.ipblocks.findOne({ips: {$elemMatch: { ip: curSrv.ip}}}, function(err, data){
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

function serverFindImage(curSrv){
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
						console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
						console.log("Image Data:", data);
						console.log("Pool Data:", sdata);
						console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
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