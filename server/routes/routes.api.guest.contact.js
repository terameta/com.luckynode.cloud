var Q				= require('q');

module.exports = function(app, express, db, tools) {
	var apiRoutes 		= express.Router();

	apiRoutes.post('/', function(req, res) {
		var curRequest = {
			type: 'contact',
			name: req.body.name,
			email: req.body.email,
			comment: req.body.comments
		};
		db.userRequests.insert(curRequest, function(err, result){
			if(err){
				console.log("Hede1");
				res.status(500).json({status:"Fail", message: "Database issue. Please try again later."});
			} else {
				tools.mailer.sendTemplateMail("Contact Form", result._id, "Contact Form: "+req.body.name, "sales@epmvirtual.com", "sales@epmvirtual.com", req.body.email, false, false, req.body.email).
				then(function(result){
					res.send("OK");
				}).
				fail(function(issue){
					console.log("Hede2", issue);
					res.status(500).json({status:"Fail", message: issue});
				});
			}
		});
	});

	app.use('/api/guest/contact', apiRoutes);
};