var Q				= require('q');

module.exports = function(app, express, db, tools) {
	var apiRoutes 		= express.Router();

	apiRoutes.get('/', tools.checkUserToken, function(req, res) {
		if(!req.user){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else if(!req.user.id){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else {
			db.settings.findOne({},{accountingemail:1, adminemail:1,companyname:1,domain:1,supportemail:1, "paypal.email":1, "paypal.issandbox":1},function(err, settings){
				if(err){
					res.status(500).json({status:"fail", detail:"Can't get settings"});
				} else {
					res.send(settings);
				}
			});
		}
	});

	app.use('/api/client/settings', apiRoutes);
};