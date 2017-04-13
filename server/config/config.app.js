var express 		= require('express');
var path 			= require('path');
var logger			= require('morgan');
var helmet			= require('helmet');
var bodyParser		= require('body-parser');
//var cookieParser	= require('cookie-parser');
var config			= require('../config/config.main.js');
//var tools			= require('../tools/tools.main.js');
var tools;


module.exports = function App(db) {
	tools 			= require('../tools/tools.main.js')(db);
	var app = express();

	//view engine setup
	app.set('views', path.join(__dirname, '../views'));
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	app.set('jwtsecret', config.secret);

	app.enable("trust proxy");

	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

	app.use(helmet());
	app.use(helmet.noCache());

	app.use(logger('short'));


	app.use(express.static(path.join(__dirname, '../../client')));

	require('../routes/index.js')(app, express, db, tools);

	app.set('port', 8000);


	var server = app.listen(app.get('port'), function() {
		console.log('Express server listening on port ' + server.address().port);
	});

	module.exports = app;
};
