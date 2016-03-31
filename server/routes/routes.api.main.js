var Q 				= require("q");
var fs 				= require("fs");
var db;
var tools;
var commander;
var userModule;

module.exports = function(app, express, refdb, reftools) {
	db 				= refdb;
	tools 			= reftools;
	commander 		= require('../tools/tools.node.commander.js')(db);
	userModule		= require('../modules/module.user.js')(db);

	var apiRoutes = express.Router();

	apiRoutes.get('/setup', function(req, res) {
		userModule.createAdminUser().
		then(res.json({status:"OK"})).
		fail(res.status(400).json("Failed to create admin user"));

		/*var adminUser = {
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
							res.json({status:"OK"});
						}
					});
				}
				else { res.json({status:"OK"}); }
			}
		});
		*/
		db.templateDocs.update(
			{templateName:"SampleContactForm"},
			{templateName:"SampleContactForm", name:"Sample Person", email:"sample@example.com", comments: "Sample comments."},
			{upsert:true}
		);

	});

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		res.json({ message: 'Welcome to the coolest API on earth!' });
	});

	apiRoutes.get('/getDBConfigForNode', function(req, res){
		isThisOurNode(req).then(function(result){
			var lnconfiguration	= JSON.parse(fs.readFileSync('luckynode.conf', 'utf8'));
			if(lnconfiguration.db.pemfile) lnconfiguration.db.pemfile = fs.readFileSync(lnconfiguration.db.pemfile, "utf8");
			res.json(lnconfiguration.db);
		}).fail(function(issue) {
			res.status(400).send("You are not one of us. You can try to jump from a high place to join the group by impressing us, but to be honest, it will most probably not work.");
		});
	});

	apiRoutes.get('/getManagers', function(req, res){


		var managerIPList = [];

		isThisOurNode(req).then(function(){
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

function isThisOurNode(theReq){
	var ip = theReq.headers['x-forwarded-for'] || theReq.connection.remoteAddress || theReq.socket.remoteAddress || theReq.connection.socket.remoteAddress;
	ip = ip.replace("::ffff:", "");
	ip = ip.replace("::FFFF:", "");

	var deferred = Q.defer();
	var curNodeIP = '';
	var isThisOurNode = false;
	db.nodes.find({}, function(err, data){
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