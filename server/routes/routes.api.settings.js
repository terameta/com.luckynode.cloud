var topDB 			= '';
var mongojs 		= require('mongojs');

module.exports = function(app, express, db, tools) {
	topDB = db;
	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res){
		db.settings.findOne({}, function(err, data){
			if(err){
				res.status(500).json({status: 'fail', error: err});
			} else if(data){
				res.send(data);
			} else {
				db.settings.insert({}, function(ierr, iresult){
					if(ierr){
						res.status(500).json({status: 'fail', error: err});
					} else {
						res.send(iresult);
					}
				});
			}
		});
	});

	apiRoutes.get('/counters', tools.checkToken, function(req, res){
		db.counters.find({}, function(err, data){
			if(err){
				res.status(500).json({status: 'fail', error: err});
			} else if(data.length > 0){
				res.send(data);
			} else {
				db.counters.insert({_id:'invoicenumber', seq:10000}, function(ierr, iresult){
					if(ierr){
						res.status(500).json({status: 'fail', error: err});
					} else {
						res.send(iresult);
					}
				});
			}
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "settings should have an id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.settings.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
				if( err ){
					res.status(500).json({ status: "fail" });
				} else {
					res.send("OK");
				}
			});
		}
	});

	app.use('/api/settings', apiRoutes);
};
