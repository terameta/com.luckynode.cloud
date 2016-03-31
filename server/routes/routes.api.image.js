var commander;
var urlparser		= require('url');

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	commander 			= require('../tools/tools.node.commander.js')(db);
	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.images.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.images.findOne({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
			if(err){
				res.status(500).json({status: "fail"});
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.post('/', tools.checkToken, function(req, res) {
		if (!req.body) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if (!req.body.name) {
			res.status(400).json({ status: "fail", detail: "image should at least have a name" });
		} else {
			var newImage = req.body;
			//console.log(curNewImage);
			if(newImage.baseDisk){
				db.images.insert(newImage, function(err, newImage) {
					if(err){
						res.status(500).json({ status: "fail", detail: "Can't insert image to the database" });
					} else {
						newImage.basefile = "image-"+newImage._id.toString();
						newImage.id = newImage._id.toString();
						delete newImage._id;
						newImage.targetPool.id = newImage.targetPool._id;
						newImage.pool = newImage.targetPool.id;
						console.log(newImage);
						console.log(">>>>>>>>>>>>>>>>>>>>>Image is inserted", newImage.id);
						db.images.update({_id: mongojs.ObjectId(newImage.id)}, {$set:newImage}, function(uerr, udata) {
							if(uerr){
								res.status(500).json({ status: "fail", detail: "Can't insert image to the database" });
							} else {
								commander.sendVirsh(newImage.baseServer.node,"pool","createImage",newImage).
								then(function(result){
									res.send("OK");
								}).
								fail(function(issue){
									console.log(issue);
									res.status(500).json({ status: "fail", detail: issue });
								});
								res.send("OK");
							}
						});
					}
				});
			} else {
				db.images.insert(newImage, function(err, data) {
					if (err) {
						res.status(500).json({ status: "fail" });
					}
					else {
						res.send(data);
					}
				});
			}
		}
	});

	apiRoutes.put('/:id', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body.name ) {
			res.status(400).json({ status: "fail", detail: "storage should have a name" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "storage should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			db.images.update({_id: mongojs.ObjectId(curid)}, req.body, function(err, data){
				if( err ){
					res.status(500).json({ status: "fail" });
				} else {
					req.body._id = curid;
					res.send(req.body);
				}
			});
		}
	});

	apiRoutes.delete('/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			var shouldErase = JSON.parse(urlparser.parse(req.url, true).query.shouldErase);
			if(shouldErase){
				console.log("We should also erase the file", shouldErase);
			} else {
				console.log("We don't need to erase the file", shouldErase);
			}
			//res.json({ status: "success" });

			db.images.findOne({_id: mongojs.ObjectId(req.params.id)}, function(ierr, idata){
				if(ierr || !idata){
					res.status(500).json({ status: "fail", detail: "couldn't get image from database" });
				} else {
					if(shouldErase){
						db.nodes.findOne({storage: {$in: [idata.pool]}}, function(nerr, ndata){
							if(nerr || !ndata){
								console.log("We fell to here");
								res.status(500).json({ status: "fail", detail: "couldn't get node for image from database" });
							} else {
								var isThereIssue = '';
								console.log("Calling volume erase");
								idata.id = idata._id.toString();
								idata.shouldErase = shouldErase;
								commander.volDelete(ndata, idata).then(function(result){
									console.log(result);
								}).fail(function(issue){
									isThereIssue = issue;
								}).finally(function(){
									db.images.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
										if(err){
											res.status(500).json({ status: "fail", detail: "couldn't delete image from database" });
										} else {
											if(isThereIssue){
												res.json({ status: "success", detail: isThereIssue });
											} else {
												res.json({ status: "success" });
											}
										}
									});
								});
							}
						});
					} else {
						db.images.remove({_id: mongojs.ObjectId(req.params.id)}, function(err, data){
							if(err){
								res.status(500).json({ status: "fail", detail: "couldn't delete image from database" });
							} else {
								res.json({ status: "success" });
							}
						});
					}
				}
			});


			return 0;

		}
	});

	app.use('/api/image', apiRoutes);
};