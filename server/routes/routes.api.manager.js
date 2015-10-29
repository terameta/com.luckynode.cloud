module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	var apiRoutes 		= express.Router();

	apiRoutes.get('/getiplist', function(req, res){
		db.nodes.find({}, function(nerr, ndata){
			var isSourceValid = false;
			ndata.forEach(function(curNode){
				if(req.ip == curNode.ip) {
					isSourceValid = true;
				}
				if(curNode.internalip){
					if(req.ip == curNode.internalip){
						isSourceValid = true;
					}
				}
			});
			if(isSourceValid){
				db.managers.find({}, function(err, data){
					if(err){
						res.status(500).json({ status: "fail" });
					} else {
						var toReturn = [];
						data.forEach(function(curManager){
							toReturn.push(curManager.ip);
							if(curManager.internalip) toReturn.push(curManager.internalip);
						});
						res.send(toReturn);
					}
				});
			} else {
				res.status(400).json({ status: "fail"});
			}
		});
	});

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		console.log("Here");
		db.managers.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				console.log(data);
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.managers.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
			res.send(data);
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res) {
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "manager should at least have a name" });
		} else {
			var curNewDC = req.body;
			//curNewDC.name = req.body.name;
			db.managers.insert(curNewDC, function(err, data) {
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
			res.status(400).json({ status: "fail", detail: "manager should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "manager should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.managers.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
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
			db.managers.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	app.use('/api/manager', apiRoutes);
};