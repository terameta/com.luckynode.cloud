var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var commander;
var tools 			= require('../tools/tools.main.js');

module.exports = function(refdb){
	db = refdb;
	commander 	= require('../tools/tools.node.commander.js')(db);
	var module = {
		create				: create,
		createAdminUser	: createAdminUser
	};
	return module;
};

function create(tokenObject){
	var deferred = Q.defer();
	if(!tokenObject){
		deferred.reject("No Object provided");
		return deferred.promise;
	}

	db.users.insert(tokenObject, function(err, result){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(result);
		}
	});

	return deferred.promise;
}

function createAdminUser(){
	var deferred = Q.defer();
	var adminUser = {
		email: 'admin@local',
		pass: tools.generateHash('admin@local'),
		isAdmin: true
	};

	db.users.findOne({ isAdmin: true }, {pass:0}, function(err, data) {
		if (err) { deferred.reject(err); }
		else if (data == null) {
			create(adminUser).then(function(result){
				deferred.resolve("OK");
			}).fail(deferred.reject);
		} else {
			deferred.resolve("OK");
		}
	});

	return deferred.promise;
}