module.exports = function(app, passport) {
	app.get('/', function(req, res) {
		res.redirect('/cloud/');
	});

	app.get('/signin', function(req, res){
		res.redirect('/');
	});

	app.get('/home', function(req, res){
		res.redirect('/');
	});
};