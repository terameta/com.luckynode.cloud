var Q				= require('q');

module.exports = function(app, express, db, tools) {
	var curModule 		= require('../modules/module.plan.js')(db);
	var apiRoutes 		= express.Router();

	apiRoutes.get('/', tools.checkUserToken, function(req, res) {
		if(!req.user){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else if(!req.user.id){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else {
			curModule.list().then(function(result){
				res.send(result);
			}).fail(function(issue){
				res.status(500).json({ status: 'fail', message: "Can't list servers" });
			});
		}
	});

	app.use('/api/client/plan', apiRoutes);
};