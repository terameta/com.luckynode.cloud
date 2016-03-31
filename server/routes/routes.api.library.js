var commander;
var handlebars 	= require('handlebars');
var moment			= require('moment');

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	var libraryModule= require('../modules/module.library.js')(db);
	commander 	= require('../tools/tools.node.commander.js')(db);
	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.library.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.library.findOne({_id:parseInt(req.params.id,10)}, function(err, data){
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
			var curNewTutorial = req.body;
			libraryModule.getNextID(curNewTutorial).
			then(libraryModule.create).
			then(function(result){
				res.send(curNewTutorial);
			}).
			fail(function(issue){
				res.json(500).json({ status: 'fail', message: issue});
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
			db.library.update({_id: parseInt(curid,10)}, req.body, function(err, data){
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
			db.library.remove({_id: parseInt(req.params.id,10)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	apiRoutes.get('/preview/:id', function(req, res) {
		libraryModule.compile(req.params.id).then(function(result){
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

	app.use('/api/library', apiRoutes);
};