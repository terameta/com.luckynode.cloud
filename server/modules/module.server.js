var db;
var Q		= require('q');

module.exports = function(refdb){
	db = refdb;
	var module = {
		listServers: listServers,
		showServers: showServers
	};
	return module;
};

function listServers(query){
	var deferred = Q.defer();
	if(!query) query = {};
	console.log(query);
	db.servers.find(query, function(err, data) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
}

function showServers(){
	console.log("Show Servers");
}