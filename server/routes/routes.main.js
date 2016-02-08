module.exports = function(app, passport) {
	app.get('/', function(req, res) {
		res.redirect('/home/');
	});

	app.get('/home/*', function(req,res){
		res.render('../../client/home/index.html');
	});

	app.get('/signin', function(req, res){
		res.redirect('/');
	});
};