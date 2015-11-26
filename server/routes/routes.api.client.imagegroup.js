var commander		= require('../tools/tools.node.commander.js');
var urlparser		= require('url');

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');

	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkUserToken, function(req, res) {
		db.imagegroups.find({type:'public'}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});
	/*
	apiRoutes.post('/', tools.checkToken, function(req, res) {
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "image group should at least have a name" });
		} else {
			var curImageGroup = req.body;
			//curNewDC.name = req.body.name;
			db.imagegroups.insert(curImageGroup, function(err, data) {
				if (err) {
					res.status(500).json({ status: "fail" });
				} else {
					res.send(data);
				}
			});
		}
	});
	*/
	apiRoutes.get('/:id', tools.checkUserToken, function(req, res) {
		db.imagegroups.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
			if(err){
				res.status(500).json({status: "fail"});
			} else {
				res.send(data);
			}
		});
	});
	/*
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
			db.imagegroups.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
				if( err ){
					res.status(500).json({ status: "fail" });
				} else {
					req.body._id = curid;
					res.send(req.body);
				}
			});
		}
	});
	*/
	/*
	apiRoutes.delete('/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			db.imagegroups.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail", detail: "couldn't delete image group from database" });
				} else {
					res.json({ status: "success" });
				}
			});

			return 0;

		}
	});
	*/

	app.use('/api/client/imagegroup', apiRoutes);
};