module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');

	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.datacenters.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.datacenters.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
			res.send(data);
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res) {
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "datacenter should at least have a name" });
		} else {
			var curNewDC = req.body;
			//curNewDC.name = req.body.name;
			db.datacenters.insert(curNewDC, function(err, data) {
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
			res.status(400).json({ status: "fail", detail: "datacenter should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "datacenter should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.datacenters.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
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
			db.datacenters.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	app.use('/api/datacenter', apiRoutes);
};