var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var Twocheckout 	= require('2checkout-node');

module.exports = function(app, express, refdb, tools) {
	db = refdb;

	var apiRoutes 		= express.Router();
	var querystring 	= require("querystring");

	apiRoutes.post('/IPN',  function(req, res) {
		console.log("==========================================================");
		console.log("==========================================================");
		console.log("IPN Body");
		console.log(req.body);
		console.log("==========================================================");
		console.log("==========================================================");
		/*db.invoices.update({_id:parseInt(req.body.item_name,10)}, {$addToSet:{transactions:parseTrx(req.body)}}, function(err, result){
			if(err){
				console.log("Transaction add issue:", err);
			} else {
				console.log("Transaction recorded to invoice", req.body.item_name);
			}
		});*/
		res.send("OK");
	});

	apiRoutes.get('/IPN',  function(req, res) {
		console.log("==========================================================");
		console.log("==========================================================");
		console.log("IPN Body GET");
		console.log(req.body);
		console.log("==========================================================");
		console.log("==========================================================");
		/*db.invoices.update({_id:parseInt(req.body.item_name,10)}, {$addToSet:{transactions:parseTrx(req.body)}}, function(err, result){
			if(err){
				console.log("Transaction add issue:", err);
			} else {
				console.log("Transaction recorded to invoice", req.body.item_name);
			}
		});*/
		res.send("OK");
	});


	apiRoutes.post('/pay/:id', tools.checkUserToken, function(req, res){
		if(!req.user){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else if(!req.user.id){
			res.status(400).json({ status: "fail", detail: "no user provided" });
		} else if(!req.body){
			res.status(400).json({ status: "fail", detail: "no data provided" });
		} else {
			var cObject = {};
			cObject.userid 		= req.user.id;
			cObject.invoiceid 	= req.params.id;
			cObject.token 			= req.body.response.token.token;
			cObject.holder			= req.body.holder;

			getSettings(cObject).
			then(setTCO).
			then(getUser).
			then(getInvoice).
			then(chargeCard).
			then(setInvoice).
			then(function(result){ res.send("OK"); }).
			fail(function(issue){
				console.log(issue);
				res.status(500).json({status:"fail", detail:issue});
			});
		}
	});

	app.use('/api/payment/tco', apiRoutes);
};

function getSettings(cObject){
	if(!cObject) cObject = {};
	var deferred = Q.defer();
	db.settings.findOne(function(err, settings){
		if(err){
			deferred.reject(err);
		} else {
			cObject.settings = settings;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function setTCO(cObject){
	if(!cObject) cObject = {};
	var deferred = Q.defer();
	cObject.tco = new Twocheckout({
		apiUser: 	cObject.settings.tco.username, 										// Admin API Username, required for Admin API bindings
		apiPass: 	cObject.settings.tco.password, 										// Admin API Password, required for Admin API bindings
		sellerId: 	cObject.settings.tco.sellerid, 										// Seller ID, required for all non Admin API bindings
		privateKey:	cObject.settings.tco.privatekey, 									// Payment API private key, required for checkout.authorize binding
		secretWord: cObject.settings.tco.secret, 											// Secret Word, required for response and notification checks
		demo: 		cObject.settings.tco.isdemo.toString() === 'true', 			// Set to true if testing response with demo sales
		sandbox: 	cObject.settings.tco.issandbox.toString() === 'true' 			// Uses 2Checkout sandbox URL for all bindings
	});
	deferred.resolve(cObject);
	return deferred.promise;
}

function getUser(cObject){
	if(!cObject) cObject = {};
	var deferred = Q.defer();
	db.users.findOne({_id:mongojs.ObjectId(cObject.userid)}, function(err, user){
		if(err){
			deferred.reject(err);
		} else if(!user){
			deferred.reject("User can't be found");
		} else {
			cObject.user = user;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function getInvoice(cObject){
	if(!cObject) cObject = {};
	var deferred = Q.defer();
	db.invoices.findOne({_id:parseInt(cObject.invoiceid,10)}, function(err, invoice){
		if(err){
			deferred.reject(err);
		} else if(!invoice){
			deferred.reject("Invoice can't be found");
		} else {
			cObject.invoice = invoice;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function chargeCard(cObject){
	var deferred = Q.defer();
	if(!cObject){ deferred.reject("No detail provided"); return deferred.promise;}

	console.log(cObject.settings);

	var params = {
		"merchantOrderId": 	cObject.settings.tco.sellerid,
		"token": 				cObject.token,
		"currency": 			"USD",
		"billingAddr": {
			"name": 				cObject.holder,
			"addrLine1": 		cObject.user.address,
			"city": 				cObject.user.city,
			"state": 			cObject.user.state,
			"zipCode": 			cObject.user.postcode,
			"country": 			cObject.user.country,
			"email": 			cObject.user.email,
			"phoneNumber": 	cObject.user.phone
		}
	};
	var theItem = {
		price: 					Number(parseFloat(cObject.invoice.netTotal).toFixed(2)),
		quantity: 				1,
		name: 					cObject.invoice.details.number,
		tangible: 				'N',
		type: 					'product'
	};
	params.lineItems = [];
	params.lineItems.push(theItem);
	cObject.tco.checkout.authorize(params, function(error, data) {
		if (error) {
			console.log(error.message);
			deferred.reject(error.message);
		} else {
			cObject.tcoresult = data;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function setInvoice(cObject){
	var deferred = Q.defer();
	if(!cObject){ deferred.reject("No detail provided"); return deferred.promise;}
	db.invoices.update({_id:parseInt(cObject.invoiceid,10)}, {$set:{"details.status":"paid"} , $addToSet:{transactions:parseTrx(cObject.tcoresult)}}, function(err, uresult){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function parseTrx(transaction){
	var toReturn = {};
	toReturn.id 		= transaction.response.transactionId;
	toReturn.amount 	= transaction.response.total;
	toReturn.fee 		= 0;
	toReturn.method	= '2CO';
	toReturn.date		= new Date();
	return toReturn;
}