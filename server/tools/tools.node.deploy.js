var sshClient 	= require('ssh2').Client;
var Q			= require('q');

module.exports = {
	runCommand: function (details, command){
	var deferred = Q.defer();
	var conn = new sshClient;
	var shouldReject = false;
	var bufferData = '';
	conn.on('ready', function(){
		conn.exec(command, function(err, stream){
			if(err){
				deferred.reject({status: 'fail', where: 'execution', error: err});
			} else {
				stream.on('close', function(code, signal){
					conn.end();
					if(shouldReject){
						deferred.reject({status: 'fail', where: 'stream', error: bufferData});
					} else {
						deferred.resolve(bufferData);
					}
				}).on('data', function(data){
					bufferData += data;
				}).stderr.on('data', function(data){
					bufferData += data;
					shouldReject = true;
				});
			}
		});
	}).on('error', function(error){
		deferred.reject({status: 'fail', where: 'connection', error: error});
	}).connect(details);
	return deferred.promise;
	}
};

