var commander;

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	commander 	= require('../tools/tools.node.commander.js')(db);
	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.storages.find({}, {key:0},function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.storages.findOne({_id: mongojs.ObjectId(req.params.id)}, {key:0}, function(err, data){
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
			db.storages.insert(curNewDC, function(err, data) {
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
		//console.log(req.body);
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body.name ) {
			res.status(400).json({ status: "fail", detail: "storage should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "storage should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.storages.update({_id: mongojs.ObjectId(curid)}, {$set:req.body}, function(err, data){
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
			db.storages.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	apiRoutes.post('/converged', tools.checkToken,function(req, res) {
		//console.log(req.body);
		if(!req.body){
			res.status(400).json({status: 'fail', message: 'Not enough data (nothing provided)'});
		} else if(!req.body.id){
			res.status(400).json({status: 'fail', message: 'Not enough data (no id provided)'});
		} else if(!req.body.command){
			res.status(400).json({status: 'fail', message: 'Not enough data (no command provided)'});
		} else {
			commander.sendVirshQ( { storage: {$in: [req.body.id] } }, 'pool', req.body.command, {id: req.body.id} ).then(function(result){
				res.send(result);
			}).fail(function(issue){
				console.log(issue);
				res.status(500).json(issue);
			});
		}

	});

	apiRoutes.post('/definesecretuuid', tools.checkToken, function(req, res){
		if(!req.body){
			res.status(400).json({status: 'fail', message: 'Not enough data (nothing provided)'});
		} else if(!req.body.id){
			res.status(400).json({status: 'fail', message: 'Not enough data (no id provided)'});
		} else {
			var uuid = require('node-uuid');
			console.log(uuid.v4());
			res.send('OK');
		}
	});

	app.use('/api/storage', apiRoutes);
};