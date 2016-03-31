var Q				= require('q');
var db;

module.exports = function(app, express, refdb, tools) {
	db = refdb;
	var apiRoutes 		= express.Router();

	apiRoutes.get('/', tools.checkUserToken, function(req, res) {
		if(!req.user){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else if(!req.user.id){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else {
			db.settings.findOne({},{accountingemail:1, adminemail:1,companyname:1,domain:1,supportemail:1, "paypal.email":1, "paypal.issandbox":1, "tco.sellerid":1, "tco.publishablekey":1},function(err, settings){
				if(err){
					res.status(500).json({status:"fail", detail:"Can't get settings"});
				} else {
					res.send(settings);
				}
			});
		}
	});

	apiRoutes.get('/getLogo', function(req,res){
		db.settings.findOne({},{logourl:1, domain:1,_id:0}, function(err, settings) {
			if(err){
				res.status(500).json({status:"fail", detail:"Can't get settings"});
			} else {
				res.send(settings);
			}
		});
	});

	app.use('/api/client/settings', apiRoutes);
};