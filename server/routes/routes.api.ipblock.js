var topDB;
var Q			= require('q');
var topTools;

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	topDB = db;
	topTools = tools;

	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.ipblocks.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.ipblocks.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
			res.send(data);
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res) {
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "ipblock should at least have a name" });
		} else {
			var curNewBlock = req.body;
			console.log(curNewBlock);
			//curNewDC.name = req.body.name;
			db.ipblocks.insert(curNewBlock, function(err, data) {
				if (err) {
					res.status(500).json({ status: "fail" });
				}
				else {
					res.send(data);
				}
			});
		}
	});

	function assignMACAddress(curBlock){
		var deferred = Q.defer();
		var curIPtoAssign = shouldAssignMAC(curBlock);
		if(curIPtoAssign >= 0){
			tools.generateMAC().then(function(result){
				curBlock.ips[curIPtoAssign].mac = result;
				if(shouldAssignMAC(curBlock) >= 0){
					assignMACAddress(curBlock).then(deferred.resolve).fail(deferred.reject);
				} else {
					deferred.resolve(curBlock);
				}
			}).fail(function(issue){
				deferred.reject(issue);
			});
		} else {
			deferred.resolve(curBlock);
		}
		return deferred.promise;
	}

	function shouldAssignMAC(curBlock){
		var curIPtoAssign = -1;
		for(var i = 0; i < curBlock.ips.length; i++){
			if(curBlock.ips[i].mac === ''){
				curIPtoAssign = i;
				break;
			}
		}
		return curIPtoAssign;
	}

	apiRoutes.put('/:id', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body.name ) {
			res.status(400).json({ status: "fail", detail: "ipblock should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "ipblock should have an _id" });
		} else {
			var curid = req.body._id;
			var curBlock = req.body;
			delete req.body._id;
			assignMACAddress(curBlock).then(function(curBlock){
				db.ipblocks.update({_id: mongojs.ObjectId(curid)}, curBlock, function(err, data){
					if( err ){
						res.status(500).json({ status: "fail" });
					} else {
						req.body._id = curid;
						res.send(req.body);
					}
				});
			}).fail(function(issue){
				res.status(500).json({status: "fail", message: "Can't assign mac addresses"});
			});

		}
	});

	apiRoutes.delete('/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			db.ipblocks.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	app.use('/api/ipblock', apiRoutes);
};