var Q				= require('q');

module.exports = function(app, express, db, tools) {
	var apiRoutes 		= express.Router();

	apiRoutes.post('/', function(req, res) {
		console.log(req.body);
		res.send("OK");
	});

	app.use('/api/guest/contact', apiRoutes);
};