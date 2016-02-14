var Q				= require('q');

module.exports = function(app, express, db, tools) {
	var apiRoutes 		= express.Router();

	apiRoutes.get('/', function(req, res) {
		db.settings.findOne({},{accountingemail:1, adminemail:1,companyname:1,domain:1,supportemail:1, salesemail:1, phones:1, logourl:1, _id:0},function(err, settings){
			if(err){
				res.status(500).json({status:"fail", detail:"Can't get settings"});
			} else {
				res.send(settings);
			}
		});
	});

	app.use('/api/guest/settings', apiRoutes);
};