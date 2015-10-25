module.exports = function(app, express, db, tools) {
	var apiRoutes = express.Router();

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
						var role = 'user';
						if(data.isAdmin) role = 'admin';
						var payload = {
							email: data.email,
							role: role
						};
						var token = tools.jwt.sign(payload, app.get('jwtsecret'), {
							expiresInMinutes: 60*24*30 // expires in 30 days
						});
						res.json({
							status: 'success',
							message: 'Enjoy your token!',
							token: token
						});
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
			res.send(userId);
		}
	});

	app.use('/api/users', apiRoutes);
};