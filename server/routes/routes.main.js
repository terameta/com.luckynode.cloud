module.exports = function(app, passport) {
	app.get('/admin/*', function(req,res){
		res.render('../../client/admin/index.html');
	});
	app.get('/cloud/*', function(req,res){
		res.render('../../client/cloud/index.html');
	});

	app.get('/*', function(req,res){
		res.render('../../client/home/index.html');
	});
};