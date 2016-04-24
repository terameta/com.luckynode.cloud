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

	apiRoutes.get('/b2credentials', function(req, res) {
		db.settings.find({}, function(err, settings){
			if(err){
				res.status(500).send(err);
			} else {
				res.send(settings.backblaze.enabledips + ":::"+ req.ip);
			}
		});
	});


	app.use('/api/backup', apiRoutes);
};