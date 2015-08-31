module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	var deployer		= require('../tools/tools.node.deploy.js');
	var commander		= require('../tools/tools.node.commander.js');

	var apiRoutes = express.Router();

	function getMyIPs(){
		var toReturn = [];
		var os = require( 'os' );

		var networkInterfaces = os.networkInterfaces( );

		for(var netKey in networkInterfaces){
			networkInterfaces[netKey].forEach(function(curAddr){
				if(!curAddr.internal){
					toReturn.push(curAddr.address);
				}
			});
		}
		return toReturn;
	}

	apiRoutes.get('/restart/:id', tools.checkToken, function(req, res){
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			var nodeId = req.params.id;
			db.nodecs.findOne({_id: mongojs.ObjectId(nodeId)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "database connection failed"});
				} else if(!data) {
					res.status(500).json({ status: "fail", detail: "node is not deployed yet"});
				} else {
					db.nodes.findOne({_id: mongojs.ObjectId(nodeId)}, function(nerr, ndata){
						if(nerr){
							res.status(500).json({ status: "fail", detail: "database connection failed"});
						} else if(!ndata){
							res.status(500).json({ status: "fail", detail: "node doesn't exist in the database"});
						} else {
							var curHost = '';
							if(ndata.ip) curHost = ndata.ip;
							if(ndata.internalip) curHost = ndata.internalip;
							if(!curHost){
								console.log("The node doesn't have an IP address assigned");
								res.status(500).json({ status: "fail", detail: "node doesn't have an IP address assigned"});
							} else {
								var serverDetails = {}; //Server Details
								serverDetails.username 	= data.user;
								serverDetails.password 	= data.pass;
								serverDetails.host 		= curHost;
								serverDetails.port 		= 14422;
								console.log(serverDetails);
								var curCommand = 'sudo shutdown -r now';
								deployer.runCommand(serverDetails, curCommand).then(
									function(result){
										res.send(result);
									}
								).fail(
									function(issue){
										res.status(500).json({ status: "fail", detail: issue});
									}
								);
							}
						}
					});
				}
			});
		}
	});

	apiRoutes.get('/getPools/:id', tools.checkToken, function(req, res){
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.nodes.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database"});
				} else if(!data){
					res.status(500).json({ status: "fail", detail: "No node with given ID"});
				} else {
					res.json(data.storage);
				}
			});
		}
	});

	apiRoutes.get('/getInterfaces/:id', tools.checkToken, function(req, res){
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id) {
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.nodes.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database"});
				} else {
					commander.nodeInterfaceList(data).then(function(result){
						res.json(JSON.parse(result));
					}).fail(function(issue){
						console.log(issue);
						res.status(500).json({ status: "fail", detail: "Cannot get interfaces"});
					});
				}
			});
		}

	});

	apiRoutes.post('/bridgeAssign/:id', tools.checkToken, function(req, res){
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id) {
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.body.adapter) {
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(req.body.adapter.indexOf('eth') < 0){
			res.status(400).json({ status: "fail", detail: "adapter name is not valid"});
		} else {
			db.nodes.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database"});
				} else {
					commander.nodeInterfaceList(data).then(function(result){
						result = JSON.parse(result);
						var candidateInterface = req.body.adapter;
						var candidateBridge = candidateInterface.replace("eth", "br");
						var doWeHaveInterface = false;
						var isBridgeFree = true;
						result.forEach(function(curInt){
							if(curInt.name == candidateInterface) doWeHaveInterface = true;
							if(curInt.name == candidateBridge) isBridgeFree = false;
						});
						if(!doWeHaveInterface){
							res.status(500).json({ status: "fail", detail: "Server doesn't have the interface."});
							return 0;
						}
						if(!isBridgeFree){
							res.status(500).json({ status: "fail", detail: "Bridge is not available for creation."});
							return 0;
						}
						//console.log("Bridge is free", candidateBridge);
						//console.log("Interface exists", candidateInterface);
						commander.nodeBridgeAssign(data, {bridge: candidateBridge, iface: candidateInterface}).then(function(result){
							commander.nodeInterfaceList(data).then(function(result){
								res.json(JSON.parse(result));
							}).fail(function(issue){
								console.log(issue);
								res.status(500).json({ status: "fail", detail: "Cannot get interfaces"});
							});
						}).fail(function(issue){
							res.status(500).json({ status: "fail", detail: "Cannot assign bridge to the interface on node"});
							console.log("Issue:",issue);
						});
						console.log(result);
					}).fail(function(issue){
						res.status(500).json({ status: "fail", detail: "Cannot list interfaces from the node"});
						console.log(issue);
					});
				}
			});
		}
	});

	apiRoutes.post('/bridgeDetach/:id', tools.checkToken, function(req, res) {
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.params.id) {
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(!req.body.bridge) {
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else if(req.body.bridge.indexOf('br') < 0){
			res.status(400).json({ status: "fail", detail: "bridge name is not valid"});
		} else {
			db.nodes.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database"});
				} else {
					commander.nodeInterfaceList(data).then(function(result){
						result = JSON.parse(result);
						var candidateBridge = req.body.bridge;
						var doWeHaveBridge = false;
						result.forEach(function(curBr){
							if(curBr.name == candidateBridge) doWeHaveBridge = true;
						});
						if(!doWeHaveBridge){
							res.status(500).json({ status: "fail", detail: "Server doesn't have the bridge defined."});
							return 0;
						}
						commander.nodeBridgeDetach(data, {bridge: candidateBridge}).then(function(result){
							commander.nodeInterfaceList(data).then(function(result){
								res.json(JSON.parse(result));
							}).fail(function(issue){
								console.log(issue);
								res.status(500).json({ status: "fail", detail: "Cannot get interfaces"});
							});
						}).fail(function(issue){
							console.log(issue);
							res.status(500).json({ status: "fail", detail: "Cannot detach interface from the bridge"});
						});
					}).fail(function(issue){
						res.status(500).json({ status: "fail", detail: "Cannot list interfaces from the node"});
						console.log(issue);
					});
				}
			});
		}
	});

	apiRoutes.get('/deploystatus/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.nodes.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "Cannot access to database"});
				} else {
					console.log(data.status);
					res.send(data.status);
				}
			});
		}
	});

	apiRoutes.post('/deploy/:step/:id', tools.checkToken, function(req, res){
		if(!req.body || !req.params.step || !req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided"});
		} else {
			db.nodes.findOne({_id:mongojs.ObjectId(req.params.id)}, function(nodeerr, nodedata){
				if(nodeerr){
					res.status(500).json({ status: "fail", detail: "can't access to database"});
				} else if(!nodedata){
					res.status(500).json({ status: "fail", detail: "no node with the given id"});
				} else {
					//console.log(nodedata);
					var curHost = '';
					if(nodedata.ip) curHost = nodedata.ip;
					if(nodedata.internalip) curHost = nodedata.internalip;
					if(!curHost){
						console.log("The node doesn't have an IP address assigned");
						res.status(500).json({ status: "fail", detail: "node doesn't have an IP address assigned"});
					} else {
						//console.log("we are ready:", curHost);
						var repo = '***REMOVED***';
						var openSSLCommand = 'openssl req -new -newkey rsa:4096 -days 36500 -nodes -x509 -subj "/C=TR/ST=Konya/L=Konya/O=Dis/CN=cloud0.luckynode.com" -keyout cloud.key -out cloud.crt';
						var foreverCommand = 'forever -a --minUptime 1000 --spinSleepTime 5000 --uid "nodeluckynode" start server/app.js';
						var crontabCommand = '( crontab -l | grep -v "node.luckynode.com/croner.sh" | grep -v "no crontab for " ; echo "* * * * * sudo sh -c \\\"chmod +x ~/node.luckynode.com/croner.sh; sh ~/node.luckynode.com/croner.sh >> ~/node.luckynode.com/log/croner.log\\\"" ) | crontab -';
						var crontabForever = '( crontab -l | grep -v "node.luckynode.com/foreve.sh" | grep -v "no crontab for " ; echo "@reboot   sudo sh -c \\\"chmod +x ~/node.luckynode.com/foreve.sh; sh ~/node.luckynode.com/foreve.sh >> ~/node.luckynode.com/log/croner.log\\\"" ) | crontab -';

						var serverDetails = {}; //Server Details
						serverDetails.username 	= req.body.user;
						serverDetails.password 	= req.body.pass;
						serverDetails.host 		= curHost;
						serverDetails.port 		= req.body.port;

						var steps = [];
						steps.push({ order: 0, 				Description: 'Initiate', 					command: ''		 																					});
						steps.push({ order: steps.length,	Description: 'Create User',					command: ''		 																					});
						steps.push({ order: steps.length,	Description: 'Create Pass',					command: ''		 																					});
						steps.push({ order: steps.length,	Description: 'Make Sudoer',					command: ''		 																					});
						steps.push({ order: steps.length,	Description: 'Assign SSH Port',				command: ''		 																					});
						steps.push({ order: steps.length,	Description: 'Disable Root SSH',			command: ''		 																					});
						steps.push({ order: steps.length,	Description: 'Enable User SSH',				command: ''		 																					});
						steps.push({ order: steps.length,	Description: 'Reload SSH Settings',			command: ''		 																					});
						steps.push({ order: steps.length, 	Description: 'Validate New User',			command: 'uptime' 																					});
						steps.push({ order: steps.length, 	Description: 'Update Packages', 			command: 'apt-get -y update >> /tmp/install.log 2>&1' 												});
						steps.push({ order: steps.length,	Description: 'Upgrade Packages',			command: 'apt-get -y upgrade >> /tmp/install.log 2>&1' 												});
						steps.push({ order: steps.length,	Description: 'Upgrade Kernel',				command: 'apt-get -y dist-upgrade >> /tmp/install.log 2>&1'											});
						steps.push({ order: steps.length,	Description: 'Remove unnecessary packages',	command: 'apt-get -y autoremove >> /tmp/install.log 2>&1' 											});
						steps.push({ order: steps.length,	Description: 'Clean unnecessary packages',	command: 'apt-get -y autoclean >> /tmp/install.log 2>&1' 											});
						steps.push({ order: steps.length,	Description: 'Install Firewall & Screen',	command: 'apt-get -y install iptables screen nfs-common netcf >> /tmp/install.log 2>&1'	 			});
						steps.push({ order: steps.length,	Description: 'Activate Firewall',			command: 'service iptables start >> /tmp/install.log 2>&1' 											});
						steps.push({ order: steps.length,	Description: 'Activate IPv4 Forwarding',	command: 'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf' 										});
						steps.push({ order: steps.length,	Description: 'Install Virt Packages Step 1',command: 'apt-get install -y kvm qemu libvirt-bin libvirt-dev>> /tmp/install.log 2>&1;'				});
						steps.push({ order: steps.length,	Description: 'Install Virt Packages Step 2',command: 'apt-get install -y qemu-kvm bridge-utils supermin >> /tmp/install.log 2>&1;'				});
						steps.push({ order: steps.length,	Description: 'Install debconf-utils',		command: 'apt-get install -y debconf-utils >> /tmp/install.log 2>&1;'								});
						steps.push({ order: steps.length,	Description: 'Set libguest installation',	command: 'echo libguestfs-tools libguestfs/update-appliance boolean true | debconf-set-selections'	});
						steps.push({ order: steps.length,	Description: 'Install libguestfs-tools',	command: 'apt-get install -y libguestfs-tools libguestfs0 libguestfs-* >> /tmp/install.log 2>&1;'	});
						steps.push({ order: steps.length,	Description: 'Install Virt Packages Step 3',command: 'apt-get install -y virt-top virtinst sysv-rc-conf >> /tmp/install.log 2>&1;'				});
						steps.push({ order: steps.length,	Description: 'Install nodeJS Repository',	command: 'curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash - >> /tmp/install.log 2>&1;'	});
						steps.push({ order: steps.length,	Description: 'Install nodeJS & Build Tools',command: 'apt-get install -y nodejs gcc make build-essential git >> /tmp/install.log 2>&1;'			});
						steps.push({ order: steps.length,	Description: 'Verify node Version',			command: 'node -v >> /tmp/install.log 2>&1;'														});
						steps.push({ order: steps.length,	Description: 'Verify npm Version',			command: 'npm -v >> /tmp/install.log 2>&1;'															});
						steps.push({ order: steps.length,	Description: 'LN System: Create Folders',	command: 'cd && mkdir node.luckynode.com >> /tmp/install.log 2>&1;'									});
						steps.push({ order: steps.length,	Description: 'LN System: Init Folder',		command: 'cd && cd node.luckynode.com && git init >> /tmp/install.log 2>&1;'						});
						steps.push({ order: steps.length,	Description: 'LN System: Prepare Pull',		command: 'cd && cd node.luckynode.com && git remote add origin '+repo+' >> /tmp/install.log 2>&1;'	});
						steps.push({ order: steps.length,	Description: 'LN System: Pull Files',		command: 'cd && cd node.luckynode.com && git pull origin master >> /tmp/install.log 2>&1;'			});
						steps.push({ order: steps.length,	Description: 'LN System: Install nodemon',	command: 'npm install nodemon -g >> /tmp/install.log 2>&1;'											});
						steps.push({ order: steps.length,	Description: 'LN System: Install node-gyp',	command: 'npm install node-gyp -g >> /tmp/install.log 2>&1;'										});
						steps.push({ order: steps.length,	Description: 'LN System: Install forever',	command: 'npm install forever -g >> /tmp/install.log 2>&1;'											});
						steps.push({ order: steps.length,	Description: 'LN System: Create SSL cert',	command: 'cd && cd node.luckynode.com && '+openSSLCommand+' >> /tmp/install.log 2>&1;'				});
						steps.push({ order: steps.length,	Description: 'LN System: Install System',	command: 'cd && cd node.luckynode.com && npm install >> /tmp/install.log 2>&1;'						});
						//steps.push({ order: steps.length,	Description: 'LN System: Install monitor',	command: 'cd && cd node.luckynode.com && npm install forever-monitor >> /tmp/install.log 2>&1;'		});
						steps.push({ order: steps.length,	Description: 'LN System: Stop System',		command: 'cd && cd node.luckynode.com && forever stopall >> /tmp/install.log 2>&1;'					});
						steps.push({ order: steps.length,	Description: 'LN System: Start System',		command: 'cd && cd node.luckynode.com && '+foreverCommand+' >> /tmp/install.log 2>&1;'				});
						steps.push({ order: steps.length,	Description: 'LN System: Setup Cron Job',	command: 'cd && cd node.luckynode.com && '+crontabCommand											});
						steps.push({ order: steps.length,	Description: 'LN System: Setup Forever Job',command: 'cd && cd node.luckynode.com && '+crontabForever											});
						steps.push({ order: steps.length,	Description: 'Disable Network Manager',		command: 'sysv-rc-conf NetworkManager off >> /tmp/install.log 2>&1' 								});
						steps.push({ order: steps.length,	Description: 'Enable Networking',			command: 'sysv-rc-conf network on >> /tmp/install.log 2>&1' 										});
						steps.push({ order: steps.length,	Description: 'Remove unnecessary packages',	command: 'apt-get -y autoremove >> /tmp/install.log 2>&1' 											});
						steps.push({ order: steps.length,	Description: 'Clean unnecessary packages',	command: 'apt-get -y autoclean >> /tmp/install.log 2>&1' 											});
						steps.push({ order: steps.length,	Description: 'Add User to libvirtd Group',	command: 'usermod -a -G libvirtd $(logname) >> /tmp/install.log 2>&1' 								});
						steps.push({ order: steps.length, 	Description: 'Identify Manager',			command: 'cd && cd node.luckynode.com && echo ' + getMyIPs() + '> managerip'						});

						/*

						## apt-get -y install fail2ban >> /tmp/install.log 2>&1;

						service libvirt-bin start >> /tmp/install.log 2>&1;
						chkconfig libvirtd on >> /tmp/install.log 2>&1;
						chkconfig NetworkManager off >> /tmp/install.log 2>&1;
						chkconfig network on >> /tmp/install.log 2>&1;
						service NetworkManager stop >> /tmp/install.log 2>&1;
						echo "echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables" >> /etc/rc.local;
						*/

						runCurStep(0, req.params.id);
						res.send({ steps: steps });

						function setStatforStep(curStep, nodeId, status, message){
							db.nodes.update({_id: mongojs.ObjectId(nodeId)}, {$set: {status: {step: curStep, status: status, message: message}}}, function(err, data){
								if(err){
									console.log("Can't update the status of the node:"+nodeId);
								} else {
									//console.log(data);
									//console.log('Step ' + curStep + '/' + steps.length + ' status:' + status);
								}
							});
							++curStep;

							if(status == 'success' && parseInt(curStep,10) < steps.length) runCurStep(curStep, nodeId);
						}

						function runCurStep(curStep, nodeId){
							var cStep = curStep;

							console.log("Steps:", cStep, '/', parseInt(steps.length,10) - 1);

							if(cStep == 0){
								var userToAssign = tools.generateLongString(32);
								var passToAssign = tools.generateLongString();
								db.nodecs.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
									if(err){
										setStatforStep(cStep,nodeId,'fail', 'Can\'t access database' );
									} else {
										if(!data){
											//console.log("User is not defined");
											db.nodecs.insert({_id: mongojs.ObjectId(nodeId), user: userToAssign, pass: passToAssign }, function(insertErr, insertData){
												if(insertErr){
													setStatforStep(cStep,nodeId,'fail', 'Database looks accessible, yet again there is something wrong.' );
												} else {
													setStatforStep(cStep,nodeId,'success', 'This step succeeded' );
												}
											});
										} else {
											setStatforStep(cStep,nodeId,'success', 'This step succeeded' );
										}
									}
								});
							} else {
								db.nodecs.findOne({_id: mongojs.ObjectId(nodeId)}, function(err, data){
									if(err){
										setStatforStep(cStep,nodeId,'fail', 'Can\'t access database' );
									} else {
										if(!data.user || !data.pass){
											setStatforStep(cStep,nodeId,'fail', 'Credentials doesn\'t exist' );
										} else {
											var curUser = req.body.user;
											var curPass = req.body.pass;
											if(curUser == 'saved' && curPass == 'saved'){
												serverDetails.username = data.user;
												serverDetails.password = data.pass;
												serverDetails.port = 14422;
												curUser = data.user;
												curPass = data.pass;
											}
											if(cStep == 1){
												var curCommand = 'echo \'' + curPass + '\' | sudo -S id -u '+ data.user +' &>/dev/null || echo \'' + curPass + '\' | sudo -S useradd '+ data.user +' -m -s /bin/bash >> install.log 2>&1';
												deployer.runCommand(serverDetails, curCommand).then(
													function(){
														setStatforStep(cStep,nodeId,'success', 'This step succeeded' );
													}
												).fail(
													function(issue){
														setStatforStep(cStep,nodeId,'fail', issue );
													}
												);
											} else if(cStep <= 7){
												var st2Command = 'echo \'' + curPass + '\' | sudo -S sh -c \'echo "'+ data.user +':'+ data.pass +'" | chpasswd\'';
												if(cStep == 3) st2Command = 'echo \'' + curPass + '\' | sudo -S grep -q -F \'' + data.user + ' ALL=(ALL) NOPASSWD: ALL\' /etc/sudoers || echo \'' + req.body.pass + '\' | sudo -S echo \'' + data.user + ' ALL=(ALL) NOPASSWD: ALL\' >> /etc/sudoers';
												if(cStep == 4) st2Command = 'echo \'' + curPass + '\' | sudo -S sed -i \'/Port 22/c\Port 14422\' /etc/ssh/sshd_config';
												if(cStep == 5) st2Command = 'echo \'' + curPass + '\' | sudo -S sed -i \'/PermitRootLogin yes/c\PermitRootLogin no\' /etc/ssh/sshd_config';
												if(cStep == 6) st2Command = 'echo \'' + curPass + '\' | sudo -S grep -q -F \'AllowUsers '+ data.user +'\' /etc/ssh/sshd_config || echo \'' + curPass + '\' | sudo -S echo \'AllowUsers '+ data.user +'\' >> /etc/ssh/sshd_config';
												if(cStep == 7) st2Command = 'echo \'' + curPass + '\' | sudo -S service ssh reload';

												deployer.runCommand(serverDetails, st2Command).then(
													function(){
														setStatforStep(cStep,nodeId,'success', 'This step succeeded' );
													}
												).fail(
													function(issue){
														setStatforStep(cStep,nodeId,'fail', issue );
													}
												);
											} else {
												serverDetails.username = data.user;
												serverDetails.password = data.pass;
												serverDetails.port = 14422;
												curUser = data.user;
												curPass = data.pass;

												var stOCommand = 'sudo sh -c \'' + steps[cStep].command + '\'';
												if(steps[cStep].Description == 'LN System: Setup Cron Job') stOCommand = steps[cStep].command;
												if(steps[cStep].Description == 'LN System: Setup Forever Job') stOCommand = steps[cStep].command;
												console.log(stOCommand);
												deployer.runCommand(serverDetails, stOCommand).then(
													function(){
														setStatforStep(cStep,nodeId,'success', 'This step succeeded' );
													}
												).fail(
													function(issue){
														if(issue.error.toString().substring(0,14) == 'no crontab for'){
															setStatforStep(cStep,nodeId,'success', 'This step succeeded' );
														} else {
															setStatforStep(cStep,nodeId,'fail', issue );
														}
													}
												);
											}
										}
									}
								});
							}
						}
					}
				}
			});
		}

	});

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.nodes.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.nodes.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
			res.send(data);
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res) {
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "node should at least have a name" });
		} else {
			var curNewDC = req.body;
			//curNewDC.name = req.body.name;
			db.nodes.insert(curNewDC, function(err, data) {
				if (err) {
					res.status(500).json({ status: "fail" });
				}
				else {
					res.send(data);
				}
			});
		}
	});

	apiRoutes.put('/:id', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body.name ) {
			res.status(400).json({ status: "fail", detail: "node should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "node should have an _id" });
		} else {
			var curid = req.body._id;
			var storageChanged = req.body.storageChanged;// || true;
			delete req.body._id;
			delete req.body.storageChanged;
			db.nodes.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
				if( err ){
					res.status(500).json({ status: "fail" });
				} else {
					req.body._id = curid;
					res.send(req.body);
					if(storageChanged){ commander.assignStoragePools(req.body); }
				}
			});
		}
	});

	apiRoutes.delete('/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			db.nodes.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					db.nodecs.remove({_id: mongojs.ObjectId(req.params.id)}, function(cerr, cdata){
						if(cerr){
							res.status(500).json({ status: "fail" });
						} else {
							res.json({ status: "success" });
						}
					});
				}
			});
		}
	});

	app.use('/api/node', apiRoutes);
};