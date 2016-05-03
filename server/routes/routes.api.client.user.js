var Q				= require('q');
var mongojs		= require('mongojs');

module.exports = function(app, express, db, tools) {
	var theModule 		= require('../modules/module.image.js')(db);
	var apiRoutes 		= express.Router();

	apiRoutes.get('/details/', tools.checkUserToken, function(req, res) {
		if(!req.user){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else if(!req.user.id){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else {
			db.users.findOne({_id:mongojs.ObjectId(req.user.id)},{accountTransactions:0, pass:0, verificationcode:0},function(err, user){
				if(err || !user){
					res.status(500).json({status:"fail", message:"Failed to receive user details"});
				} else {
					res.json(user);
				}
			});
		}
	});

	app.use('/api/client/users', apiRoutes);
};