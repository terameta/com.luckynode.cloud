var Q				= require('q');
var mongojs			= require('mongojs');

module.exports = function(app, express, db, tools) {
	var invoiceModule 		= require('../modules/module.invoice.js')(db);
	var apiRoutes 				= express.Router();

	apiRoutes.get('/', tools.checkUserToken, function(req, res) {
		if(!req.user){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else if(!req.user.id){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else {
			invoiceModule.getUserBalance({userid:req.user.id}).then(function(refObj){
				//console.log(refObj);
				res.json(refObj);
			}).fail(function(issue){
				console.log(issue);
				res.status(500).json({ status: 'fail', message: "Can't list invoices" });
			});
		}
	});

	app.use('/api/client/account', apiRoutes);
};