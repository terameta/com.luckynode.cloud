var topDB 			= '';
var mongojs 		= require('mongojs');

module.exports = function(app, express, db, tools) {
	topDB = db;
	var apiRoutes = express.Router();

	function generateToken(user){
		var role = 'user';
		if(user.isAdmin) role = 'admin';
		var payload = {
			id: user._id,
			email: user.email,
			role: role
		};
		var token = tools.jwt.sign(payload, app.get('jwtsecret'), {
			expiresInMinutes: 60*24*30 // expires in 30 days
		});
		return { status: 'success', message: 'Enjoy your token!', token: token };
	}

	apiRoutes.post('/authenticate', function(req, res) {
		//console.log(req.body);
		db.users.findOne({email:req.body.email},function(err, data){
			if(err) { res.status(400).json(err); }
			else {
				if( data == null){ res.status(401).json({status:'fail'}); }
				else {
					if(!tools.compareHash(req.body.pass, data.pass)){
						res.status(401).json({status:'fail'});
					} else {
						/*
						var role = 'user';
						if(data.isAdmin) role = 'admin';
						var payload = {
							email: data.email,
							role: role
						};
						var token = tools.jwt.sign(payload, app.get('jwtsecret'), {
							expiresInMinutes: 60*24*30 // expires in 30 days
						});*/
						res.json(generateToken(data));
					}
				}
			}
		});
	});

	apiRoutes.post('/signup', function(req, res){
		db.users.find({}, function(err, data){console.log(data);});
		db.users.remove({isAdmin: {$ne: true}}, function(err, data){});
		db.users.find({}, function(err, data){console.log(data);});
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
				db.users.insert(curUser, function(ierr, idata){
					if(ierr){
						res.status(500).json({ status: 'fail', error: err });
					} else {
						res.send(idata._id);
						sendVerificationEmail(idata._id);
					}
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
						db.users.update({_id: mongojs.ObjectId(req.body.id)}, {$set:{verified:true}}, function(uerr, udata) {
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
				res.send(data);
			}
		});
	});

	app.use('/api/users', apiRoutes);
};

function sendVerificationEmail(id){
	var tools = require('../tools/tools.main.js');
	var theCode = tools.generateLongString(8);
	topDB.users.update({_id: mongojs.ObjectId(id)}, {$set: {verificationcode:theCode}}, function(err, data){
		if(err){
			tools.logger.error("Can't send verificationcode", data, true);
		} else {
			console.log(data);
			tools.mailer.sendTemplateMail('verificationcode', data.email, {code: theCode, userid: id});
		}
	});
}