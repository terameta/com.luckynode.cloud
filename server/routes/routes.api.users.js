var topDB 			= '';
var mongojs 		= require('mongojs');
var Q					= require('q');
var tools;
var userModule;
var invoiceModule;

module.exports = function(app, express, db, refTools) {
	topDB 			= db;
	tools 			= refTools;
	userModule 		= require("../modules/module.user.js")(db);
	invoiceModule 	= require('../modules/module.invoice.js')(db);
	var apiRoutes 	= express.Router();

	function generateToken(user){
		var role = 'user';
		if(user.isAdmin) role = 'admin';
		var payload = {
			id: user._id,
			email: user.email,
			role: role
		};
		var token = tools.jwt.sign(payload, app.get('jwtsecret'), {
			expiresIn: 60*60*24*30 // expires in 30 days
		});
		return { status: 'success', message: 'Enjoy your token!', token: token };
	}

	apiRoutes.post('/authenticate', function(req, res) {
		db.users.findOne({email:req.body.email},function(err, data){
			if(err) {
				console.log("Authenticate DB Error:", err);

				res.status(400).json(err);
			} else if(data == null){
				res.status(401).json({status:'fail'});
			} else if(req.body.lostverification && req.body.lostverification == data.lostPassCode){
				var curPass = tools.generateHash(req.body.pass);
				db.users.update({_id:mongojs.ObjectId(data._id)},{$set:{pass:curPass}}, function(err, udata){
					if(err){
						res.status(500).json(err);
					} else {
						data.pass = curPass;
						res.json(generateToken(data));
					}
				});
			} else if(!tools.compareHash(req.body.pass, data.pass)){
				res.status(401).json({status:'fail'});
			} else {
				res.json(generateToken(data));
			}
		});
	});

	apiRoutes.post('/changepassword', tools.checkUserToken, function(req, res){
		db.users.findOne({_id:mongojs.ObjectId(req.user.id)}, function(err, user){
			if(err){
				res.status(500).json(err);
			} else if(user == null){
				res.status(401).json({status:'fail'});
			} else if(!tools.compareHash(req.body.curPass, user.pass)){
				res.status(400).json({status:'fail', message:'Old password is wrong.'});
			} else {
				db.users.update({_id:mongojs.ObjectId(req.user.id)}, {$set:{pass:tools.generateHash(req.body.newPass)}}, function(err, result){
					if(err){
						res.status(500).json(err);
					} else {
						res.send("OK");
					}
				});
			}
		});
	});

	apiRoutes.post('/sendLostPassCode', function(req, res) {
		console.log("sendLostPassCode") ;
		console.log(req.body);
		if(!req.body){
			res.status(400).json({status:"fail", message:"No email provided"});
		} else if(!req.body.email){
			res.status(400).json({status:"fail", message:"No email provided"});
		} else {
			db.users.findOne({email:req.body.email}, function(err, user) {
				if(err){
					res.status(500).json({status:"fail", message:"Database error"});
				} else {
					console.log(user);
					sendLostPassMail(user._id, user.email);
					res.send("OK");
				}
			});
		}
	});

	apiRoutes.post('/signup', function(req, res){
		db.users.findOne({email: req.body.email}, function(err, data){
			if(err) {
				res.status(500).json({ status: 'fail', error: err });
			} else if( data != null ){
				res.status(400).json({ status: 'fail', error: 'This e-mail address is already registered'});
			} else {
				var curUser = {
					email: req.body.email,
					pass: tools.generateHash(req.body.pass),
					role: 'user'
				};
				userModule.create(curUser).
				then(function(curUser){
					res.send(curUser._id);
					sendVerificationEmail(curUser._id);
				}).fail(function(issue){
					res.status(500).json({ status: 'fail, error: issue'});
				});
			}
		});
	});

	apiRoutes.post('/resendvc', function(req, res){
		if(!req.body){
			res.status(400).json({ status: 'fail', error: 'No user provided' });
		} else if(!req.body.id) {
			res.status(400).json({ status: 'fail', error: 'No user provided' });
		} else {
			var userId = req.body.id;
			console.log(userId);
			sendVerificationEmail(userId);
			res.send(userId);
		}
	});

	apiRoutes.post('/verifycode', function(req, res) {
		if(!req.body){
			res.status(400).json({ status: 'fail', error: 'No data provided' });
		} else if(!req.body.id){
			res.status(400).json({ status: 'fail', error: 'No user provided' });
		} else if(!req.body.code){
			res.status(400).json({ status: 'fail', error: 'No code provided' });
		} else {
			db.users.findOne({_id: mongojs.ObjectId(req.body.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: 'fail', error: err });
				} else {
					if(data.verificationcode != req.body.code){
						res.status(400).json({ status: 'fail', error: 'Code is not valid' });
					} else {
						db.users.update({_id: mongojs.ObjectId(req.body.id)}, {$set:{verified:true, joindate: new Date()}}, function(uerr, udata) {
							if(uerr){
								res.status(500).json({ status: 'fail', error: uerr });
							} else {
								res.json(generateToken(data));
								//res.send("OK");
							}
						});
					}
				}
			});
		}
	});

	apiRoutes.get('/', tools.checkToken, function(req, res){
		db.users.find({}, {pass:0}, function(err, data){
			if(err){
				res.status(500).json({status: 'fail', error: err});
			} else {
				console.log("Users:", data);
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.users.findOne({_id:mongojs.ObjectId(req.params.id)}, {pass:0}, function(err, data) {
			if(err){
				res.status(500).json({status: 'fail', error: err});
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.put('/:id', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "user should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			delete req.body.accountTransactions;
			db.users.update({_id: mongojs.ObjectId(curid)}, {$set:req.body, $unset:{accountTransactions:""}}, function(err, data){
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
			console.log(req.token);
			db.users.remove({_id:mongojs.ObjectId(req.params.id)}, function(err, result){
				if(err){
					res.status(500).json({ status:"fail", detail:"User isn't deleted, db error"});
				} else {
					res.send("OK");
				}
			});
		}
	});

	apiRoutes.get('/balance/:id', tools.checkToken, function(req, res) {
		invoiceModule.getUserBalance({userid:req.params.id}).then(function(refObj){
			res.json(refObj);
		}).fail(function(issue){
			console.log(issue);
			res.status(500).json({ status: 'fail', message: "Can't list invoices" });
		});
	});

	app.use('/api/users', apiRoutes);
};

function sendVerificationEmail(id){
	var wholeObject = {};
	updateUserVariable(id, {$set: {verificationcode:tools.generateLongString(8)}}).
	then(function(updateResult){ 		return getUser(id, wholeObject); 					}).
	then(function(userResult){ 		return tools.getSystemSettings(wholeObject); 	}).
	then(function(fullResult){
		return tools.mailer.sendTemplateMail(
			"New User Verification",
			id,
			wholeObject.systemSettings.companyname + ' - Please confirm your email address.',
			wholeObject.systemSettings.adminemail,
			wholeObject.user.email);
	}).
	then(function(result){ 				console.log(result); 									}).
	fail(function(issue){ 				console.log("Issue:", issue); 						});
}

function sendLostPassMail(id, email){
	var theCode = tools.generateLongString(16);
	var wholeObject = {};
	updateUserVariable(id, {$set:{lostPassCode:theCode, pass: tools.generateHash(theCode)}}).
	then(function(updateResult){ 		return getUser(id, wholeObject); 					}).
	then(function(userResult){ 		return tools.getSystemSettings(wholeObject); 	}).
	then(function(result){
		return tools.mailer.sendTemplateMail(
			"Password Refresher",
			id,
			wholeObject.systemSettings.companyname + ' - Password recovery.',
			wholeObject.systemSettings.adminemail,
			wholeObject.user.email
		);
	}).then(function(result){ 			return updateUserVariable(id, {$unset:{lostPassCode:""}});  }).
	then(function(result){ 				console.log(result); 									}).
	fail(function(issue){ 				console.log("Issue:", issue); 						});
}

function updateUserVariable(id, newVariableSetting){
	var deferred = Q.defer();
	topDB.users.update({_id: mongojs.ObjectId(id)}, newVariableSetting, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function getUser(id, refObj){
	var deferred = Q.defer();
	if(!refObj) refObj = {};
	topDB.users.findOne({_id: mongojs.ObjectId(id)}, function(err, user){
		if(err){
			deferred.reject(err);
		} else {
			refObj.user = user;
			deferred.resolve(refObj);
		}
	});
	return deferred.promise;
}