var Q 		= require("q");
var topDB;

module.exports = function(app, express, db, tools) {
	topDB = db;

	var apiRoutes = express.Router();

	apiRoutes.get('/setup', function(req, res) {
		var adminUser = {
			email: 'admin@local',
			pass: tools.generateHash('admin@local'),
			isAdmin: true
		};
		db.users.findOne({ isAdmin: true }, {pass:0}, function(err, data) {
			if (err) { res.status(400).json(err); }
			else {
				if (data == null) {
					db.users.update({ isAdmin: true }, adminUser, { upsert: true }, function(err, data) {
						if (err) { res.status(400).json(err); }
						else {
							res.json(data);
						}
					});
				}
				else { res.json(data); }
			}
		});

	});

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
						var token = tools.jwt.sign(data.email, app.get('jwtsecret'), {
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

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		res.json({ message: 'Welcome to the coolest API on earth!' });
	});

	apiRoutes.get('/getManagers', function(req, res){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
		ip = ip.replace("::ffff:", "");
		ip = ip.replace("::FFFF:", "");

		var managerIPList = [];

		isThisOurNode(ip).then(function(){
			db.managers.find({}, function(merr, mdata){
				if(merr){
					res.status(400).send(merr);
				} else {

					mdata.forEach(function(curManager){
						managerIPList.push(curManager.ip);
						if(curManager.internalip) managerIPList.push(curManager.internalip);
					});

					res.json(managerIPList);

				}
			});
		}).fail(function(issue){
			res.status(400).send("You are not one of us. You can try to jump from a high place to join the group by impressing us, but to be honest, it will most probably not work.");
		});
	});

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
		console.log(toReturn);
		return toReturn;
	}

	apiRoutes.get('/getMyIPs', function(req, res){
		res.send(getMyIPs());
	});

	app.use('/api', apiRoutes);
};

function isThisOurNode(ip){
	var deferred = Q.defer();
	var curNodeIP = '';
	var isThisOurNode = false;
	topDB.nodes.find({}, function(err, data){
		if(err){
			deferred.reject("can't connect to database.");
		} else {
			data.forEach(function(curNode){
				curNodeIP = curNode.ip;
				curNodeIP = curNodeIP.replace("::ffff:", "").replace("::FFFF:", "");
				if(curNodeIP == ip) isThisOurNode = true;
				if(curNode.internalip){
					curNodeIP = curNode.internalip;
					curNodeIP = curNodeIP.replace("::ffff:", "").replace("::FFFF:", "");
				}
				if(curNodeIP == ip) isThisOurNode = true;
			});
			if(isThisOurNode){
				deferred.resolve();
			} else {
				deferred.reject();
			}
		}
	});

	return deferred.promise;
}