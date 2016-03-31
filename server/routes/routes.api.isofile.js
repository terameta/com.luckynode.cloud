var commander;

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	commander 	= require('../tools/tools.node.commander.js')(db);
	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.isofiles.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/listIsofilesInStore/:storeid', tools.checkToken, function(req, res){
		if(!req.params){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if(!req.params.storeid){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			db.nodes.findOne({storage: { $in : [req.params.storeid] } }, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "couldn't get node from database" });
				} else {
					db.storages.findOne({_id: mongojs.ObjectId(req.params.storeid)}, function(serr, sdata){
						if(serr){
							res.status(500).json({ status: "fail", detail: "couldn't get storage from database" });
						} else if(!sdata){
							res.status(500).json({ status: "fail", detail: "couldn't get storage from database" });
						} else {
							console.log(data);
							console.log(sdata);
							commander.poolListIsos(data, sdata).then(function(result){
								console.log("Result");
								console.log(result);
								res.json(JSON.parse(result));
							}).fail(function(issue){
								console.log("issue");
								console.log(issue);
								res.status(500).json({ status: "fail", detail: "can't get disk list." });
							});
						}
					});
				}
			});
		}
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.isofiles.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
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
			res.status(400).json({ status: "fail", detail: "storage should at least have a name" });
		} else {
			var curNewDC = req.body;
			//curNewDC.name = req.body.name;
			db.isofiles.insert(curNewDC, function(err, data) {
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
			res.status(400).json({ status: "fail", detail: "storage should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "storage should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.isofiles.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
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
			db.isofiles.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	app.use('/api/isofile', apiRoutes);
};