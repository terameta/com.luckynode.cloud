var commander;
var invoiceModule;

module.exports = function(app, express, db, tools) {
	var mongojs 		= require('mongojs');
	commander 		= require('../tools/tools.node.commander.js')(db);
	invoiceModule 	= require('../modules/module.invoice.js')(db);
	var apiRoutes = express.Router();

	apiRoutes.get('/', tools.checkToken, function(req, res) {
		db.invoices.find({}, function(err, data) {
			if (err) {
				res.status(500).json({ status: "fail" });
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.get('/:id', tools.checkToken, function(req, res) {
		db.invoices.findOne({_id:parseInt(req.params.id,10)}, function(err, data){
			if(err){
				res.status(500).json({status: "fail"});
			} else {
				res.send(data);
			}
		});
	});

	apiRoutes.delete('/:id', tools.checkToken, function(req, res){
		if(!req.params.id){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			db.invoices.remove({_id: parseInt(req.params.id,10)}, function(err, data){
				if(err){
					res.status(500).json({ status: "fail" });
				} else {
					res.json({ status: "success" });
				}
			});
		}
	});

	apiRoutes.put('/:id', tools.checkToken, function(req, res){
		if ( !req.body ) {
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else if ( !req.body._id ) {
			res.status(400).json({ status: "fail", detail: "storage should have an _id" });
		} else {
			var curid = req.body._id;
			delete req.body._id;
			req.body.details.user = mongojs.ObjectId(req.body.details.user);
			console.log(req.body);
			console.log(curid);
			db.invoices.update({_id: parseInt(curid,10)}, {$set:req.body}, function(err, data){
				if( err ){
					res.status(500).json({ status: "fail" });
				} else {
					req.body._id = curid;
					res.send(req.body);
				}
			});
		}
	});

	apiRoutes.post('/', tools.checkToken, function(req, res){
		console.log("We reached 1");
		invoiceModule.getNextInvoiceNumber().
		then(res.send).
		fail(function(issue){
			console.log(issue);
			res.status(500).json({ status: "fail", message: issue});
		});
	});

	app.use('/api/invoice', apiRoutes);
};