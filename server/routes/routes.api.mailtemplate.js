var commander		= require('../tools/tools.node.commander.js');
var handlebars 	= require('handlebars');
var moment			= require('moment');

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	var templateModule= require('../modules/module.template.js')(db);

	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.mailtemplates.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.mailtemplates.findOne({_id:mongojs.ObjectId(req.params.id)}, function(err, data){
			if(err){
				res.status(500).json({status: "fail"});
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res) {
		console.log(req.body);
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "mailtemplate should at least have a name" });
		} else {
			var curNewMT = req.body;
			db.mailtemplates.insert(curNewMT, function(err, data) {
				if(err) {
					res.status(500).json({ status: "fail" });
				} else {
					res.send(data);
				}
			});
		}
	});

	apiRoutes.put('/:id', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body.name ) {
			res.status(400).json({ status: "fail", detail: "mail template should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "mail template should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.mailtemplates.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
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
			db.mailtemplates.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	apiRoutes.get('/preview/:id', function(req, res) {
		templateModule.compile(req.params.id).then(function(result){
			res.send(result);
		}).fail(function(issue){
			res.status(500).json({status:"fail", message: issue});
		});
	});

	apiRoutes.get('/getBoundDocument/:id', tools.checkToken, function(req, res) {
		templateModule.getBoundDocument(req.params.id).then(function(result){
			res.send(result);
		}).fail(function(issue){
			res.status(500).json({status:"fail",message: issue});
		});
	});

	app.use('/api/mailtemplate', apiRoutes);
};