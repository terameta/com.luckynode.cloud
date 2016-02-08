var commander		= require('../tools/tools.node.commander.js');
var handlebars 	= require('handlebars');
var moment			= require('moment');

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	var libraryModule= require('../modules/module.library.js')(db);

	var apiRoutes = express.Router();

	apiRoutes.get('/', function(req, res) {
		db.library.find({}, {content:0}).sort({parent:1, order:1}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', function(req, res) {
		db.library.findOne({_id:parseInt(req.params.id,10)}, function(err, data){
			if(err){
				res.status(500).json({status: "fail"});
			} else {
				res.send(data);
			}
		});
	});

	app.use('/api/client/library', apiRoutes);
};