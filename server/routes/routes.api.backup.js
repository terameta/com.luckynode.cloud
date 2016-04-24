module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	var apiRoutes 		= express.Router();

	apiRoutes.get('/b2credentials', function(req, res) {
		db.settings.findOne({}, function(err, settings){
			if(err){
				res.status(500).send(err);
			} else {
				console.log(settings.backblaze, req.ip);
				var ipList = settings.backblaze.enabledips.split(",");
				console.log(ipList);
				res.send(settings.backblaze.enabledips);
			}
		});
	});


	app.use('/api/backup', apiRoutes);
};