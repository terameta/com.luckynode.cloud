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
				var shouldWeSend = false;
				ipList.forEach(function(curIP){
					if(curIP == req.ip) shouldWeSend = true;
				});
				if(shouldWeSend){
					delete settings.backblaze.enabledips;
					res.send(settings.backblaze);
				} else {
					res.status(400).send("Not authorized");
				}
			}
		});
	});


	app.use('/api/backup', apiRoutes);
};