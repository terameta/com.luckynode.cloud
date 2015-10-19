var Q				= require('q');
var topDB 			= '';
var mongojs 		= require('mongojs');
var commander		= require('../tools/tools.node.commander.js');
var path 			= require('path');

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
				then(function(result){ curNewServerNode = result; curNewServer.bridge = result.netBridge;	return serverFindIPBlock(curNewServer);		}).
				then(function(result){																		return serverUpdate(curNewServer);			}).
				then(function(result){																		return serverReserveIP(curNewServer);		}).
				then(function(result){ 																		return serverFindImage(curNewServer);		}).
				then(function(result){
					res.send(curNewServer);
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
							commander.serverVNCAddress(ndata, sdata).then(function(cSrv){
								cSrv = JSON.parse(cSrv);
								if(cSrv.vncport == -1){
									res.status(500).json({ status: "fail", detail: 'Server is not running. Please start the server first.'});
								} else {
									persistentInitiateVNCProxy(ndata.ip, cSrv.vncport, 6783, tools).then(function(result){
										res.json({port:result});
									}).fail(function(issue){
										res.status(400).json({ status: "fail", detail: issue});
									});
								}
							}).fail(function(issue){
								res.status(500).json({ status: "fail", detail: issue});
							});
						}
					});
				}
			});
		}
	});

	apiRoutes.get('/serverStart/:id', tools.checkToken, function(req, res) {
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
							commander.serverStart(ndata, sdata).then(function(result){
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

	apiRoutes.get('/serverShutDown/:id', tools.checkToken, function(req, res) {
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
							commander.serverShutDown(ndata, sdata).then(function(result){
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

	apiRoutes.get('/serverReboot/:id', tools.checkToken, function(req, res) {
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
							commander.serverReboot(ndata, sdata).then(function(result){
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

	apiRoutes.get('/serverPowerOff/:id', tools.checkToken, function(req, res) {
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
							commander.serverPowerOff(ndata, sdata).then(function(result){
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
					db.nodes.findOne({_id: mongojs.ObjectId(sdata.node)}, function(nerr, ndata){
						if(nerr){
							res.status(500).json({ status: "fail", detail: "Cannot access to database for nodes"});
						}else if(!ndata){
							res.status(500).json({ status: "fail", detail: "Cannot find the node with the given id of the server"});
						} else {
							sdata.id = sdata._id.toString();
							commander.serverState(ndata, sdata).then(function(result){
								res.send(JSON.parse(result).domstate);
							}).fail(function(issue){
								res.status(500).json({ status: "fail", detail: issue});
							});
						}
					});
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

	app.use('/api/server', apiRoutes);
};

function persistentInitiateVNCProxy(host, port, localport, tools){
	var deferred = Q.defer();
	var curCommand = path.resolve('.') + '/client/lib/no-vnc/utils/websockify '+localport+' '+ host +':'+ port +' --cert /etc/nginx/ssl/luckynode.pem --ssl-only -D --run-once --timeout=60';
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

function serverDelete(cSrv){
	var deferred = Q.defer();
	topDB.servers.remove({_id:mongojs.ObjectId(cSrv._id)}, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			serverReleaseIP(cSrv).then(function(result){
				deferred.resolve("Delete completed: " + data.toString());
			}).fail(function(issue){
				deferred.reject(issue);
			});
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