var commander		= require('../tools/tools.node.commander.js');
var urlparser		= require('url');

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');

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
			var curNewImage = req.body;
			//curNewDC.name = req.body.name;
			if(curNewImage.baseserver){
				db.servers.findOne({_id: mongojs.ObjectId(curNewImage.baseserver)}, function(serr, sdata){
					if(serr || !sdata){
						res.status(500).json({ status: "fail", detail: "Can't find the server mentioned for the image as base" });
					} else {
						db.nodes.findOne({_id: mongojs.ObjectId(sdata.node)}, function(nerr, ndata){
							if(nerr || !ndata){
								res.status(500).json({ status: "fail", detail: "Can't find the node for the server mentioned for the image as base" });
							} else {
								console.log("OK We will create");
								curNewImage.pool = sdata.store;
								curNewImage.status = "Creating the base file";
								db.images.insert(curNewImage, function(err, data) {
									if(err){
										res.status(500).json({ status: "fail", detail: "Can't insert image to the database" });
									} else {
										data.basefile = data._id.toString();
										if(data.imagetype == 'qcow2'){
											data.basefile += ".qcow2";
										} else {
											data.basefile += ".img";
										}
										data.id = data._id.toString();
										db.images.update({_id: mongojs.ObjectId(data._id)}, {$set:{basefile:data.basefile}}, function(uerr, udata) {
										    if(uerr){
										    	res.status(500).json({ status: "fail", detail: "Can't update image in the database" });
										    } else {
										    	console.log("We are totally ready");
										    	sdata.id = sdata._id.toString();
										    	ndata.id = ndata._id.toString();
										    	commander.volCloneFromServer(ndata, sdata, data).then(function(result){
										    		console.log("result");
										    		console.log(result);
										    	}).fail(function(issue){
										    		console.log("issue");
										    		console.log(issue);
										    	});
										    	res.send("ok");
										    }
										});
									}
								});
							}
						});
					}
				});
			} else {
				db.images.insert(curNewImage, function(err, data) {
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
					db.nodes.findOne({storage: {$in: [idata.pool]}}, function(nerr, ndata){
						if(nerr || !ndata){
							res.status(500).json({ status: "fail", detail: "couldn't get node for image from database" });
						} else {
							var isThereIssue = '';
							console.log("Calling volume erase");
							idata.id = idata._id.toString();
							idata.shouldErase = shouldErase;
							commander.volDelete(ndata, idata).then(function(result){
								//console.log(result);
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
				}
			});


			return 0;

		}
	});

	app.use('/api/image', apiRoutes);
};