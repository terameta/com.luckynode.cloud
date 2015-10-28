var mongojs 		= require('mongojs');
var multer  		= require('multer');
var upload 			= multer({ dest: 'uploads/' });
var fs				= require('fs');
var Q				= require('q');
var topDB;

module.exports = function(app, express, db, tools) {
	topDB = db;

	var apiRoutes = express.Router();

	apiRoutes.get('/:id', tools.checkUserToken, function(req, res) {
		db.users.findOne({_id: mongojs.ObjectId(req.params.id)}, {pass:0}, function(err, data){
			if(err){
				console.log(err);
				res.status(500).json({status: "fail", detail: err});
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.put('/:id', tools.checkUserToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body.name ) {
			res.status(400).json({ status: "fail", detail: "storage should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "storage should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.users.update({_id: mongojs.ObjectId(curid)}, {$set: req.body}, function(err, data){
				if( err ){
					res.status(500).json({ status: "fail" });
				} else {
					req.body._id = curid;
					res.send(req.body);
				}
			});
		}
	});

	apiRoutes.get('/getprofilepicture/:id', /*tools.checkUserToken, */function(req, res) {
		db.userfiles.findOne({user:req.params.id, usage:'profilepicture'}, function(err, data){
			if(err){
				res.status(500).json({ status: "fail", detail: err });
			} else if(data){
				res.setHeader('Content-disposition', 'attachment; filename=' + data.originalname);
  				res.setHeader('Content-type', data.mimetype);
  				res.write(data.data.buffer);
  				res.end();
			} else {
				res.send("OK");
			}
		});
	});

	apiRoutes.post('/uploadprofilepicture', tools.checkUserToken, upload.single('file'), function(req, res){
		if( !req.body ){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if( !req.body.id ){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if( !req.file ){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			//var gs = gridjs(db);
			//var gs = gridjs(mongojs('3jPm5YMWG4QPH4rYygItPmDH:6l75TzbqGk4Zo114nMjdX7gj@monger.luckynode.com:14881/cloud'));
			//fs.createReadStream(req.file.path).pipe(console.log);
			req.file.usage = 'profilepicture';
			req.file.user = req.body.id;
			wholeUploadProcess(req.file).
				then(function(result){
					res.send("OK");
				}).
				fail(function(issue){
					res.status(500).json({ status: "fail", detail: issue });
				});
		}
	});

	app.use('/api/enduser', apiRoutes);
};

function wholeUploadProcess(file){
	var deferred = Q.defer();
	getUploadedContent(file).
		then(uploadFileToUserFiles).
		then(updateUserCollectionAboutProfilePicture).
		then(deleteUploadedFileFromDisk).
		then(deferred.resolve).
		fail(function(issue){
			deferred.reject(issue);
			console.log(issue);
			deleteUploadedFileFromDisk(file);
		});
	return deferred.promise;
}

function deleteUploadedFileFromDisk(file){
	var deferred = Q.defer();
	fs.unlink(file.path, function(err, data){
		if(err){
			console.log("Can't deleteUploadedFileFromDisk");
			deferred.reject(err);
		} else {
			deferred.resolve(file);
		}
	});
	return deferred.promise;
}

function updateUserCollectionAboutProfilePicture(file){
	var deferred = Q.defer();
	topDB.users.update({_id:mongojs.ObjectId(file.user)}, {$set: {haspicture: true}}, function(err, data) {
		if(err){
			console.log("Can't updateUserCollectionAboutProfilePicture");
			deferred.reject(err);
		} else {
			deferred.resolve(file);
		}
	});
	return deferred.promise;
}

function uploadFileToUserFiles(file){
	var deferred = Q.defer();
	topDB.userfiles.update({ user: file.user, usage: file.usage }, file, {upsert: true}, function(err, data){
		if(err){
			console.log("Can't uploadFileToUserFiles");
			deferred.reject(err);
		} else {
			//console.log(data);
			deferred.resolve(file);
		}
	});
	return deferred.promise;
}

function getUploadedContent(file){
	var deferred = Q.defer();
	fs.readFile(file.path, function(err, data) {
		if(err){
			console.log("Can't getUploadedContent");
			deferred.reject(err);
		} else {
			file.data = data;
			deferred.resolve(file);
		}
	});
	return deferred.promise;
}