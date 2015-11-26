var db;
var Q		= require('q');

module.exports = function(refdb){
	db = refdb;
	var module = {
		list: list,
		find: find
	};
	return module;
};

function list(query){
	var deferred = Q.defer();
	if(!query) query = {};
	db.nodes.find(query, function(err, data) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function find(query){
	var deferred = Q.defer();
	if(!query) query = {};
	db.nodes.findOne(query, function(err, data) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}