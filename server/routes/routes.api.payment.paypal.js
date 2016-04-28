var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var invoiceModule;

module.exports = function(app, express, refdb, tools) {
	db 					= refdb;
	invoiceModule 		= require('../modules/module.invoice.js')(db);
	var apiRoutes 		= express.Router();

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
		});
		*/
		var transaction = parseTrx(req.body);
		db.transactions.update({id:transaction.id}, { $set:transaction }, {upsert:true}, function(err, uresult){
			if(err){
				console.log("Transaction add issue:", err);
			} else {
				console.log("Transaction recorded to account", transaction.userid);
			}
		});
		db.invoices.update({"details.user":mongojs.ObjectId(transaction.userid)}, {$set:{"details.status":"paid"}}, {multi:true}, function(err, iuresult){
			if(err){
				console.log("Invoices are not updated", err);
			}
		});

		res.send("OK");
	});

	apiRoutes.post('/success/', function(req, res){
		console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
		console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
		console.log("Success Body");
		console.log(req.body);
		console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
		console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
		/*db.invoices.update({_id:parseInt(req.params.id,10)}, {$addToSet:{transactions:parseTrx(req.body)}}, function(err, result){
			if(err){
				console.log("Transaction add issue:", err);
			} else {
				console.log("Transaction recorded to invoice", req.params.id);
			}
		});*/
		var transaction = parseTrx(req.body);
		db.transactions.update({id:transaction.id}, { $set:transaction }, {upsert:true}, function(err, uresult){
			if(err){
				console.log("Transaction add issue:", err);
			} else {
				console.log("Transaction recorded to account", transaction.userid);
			}
		});
		db.invoices.update({"details.user":mongojs.ObjectId(transaction.userid)}, {$set:{"details.status":"paid"}}, {multi:true}, function(err, iuresult){
			if(err){
				console.log("Invoices are not updated", err);
			}
		});
		db.settings.findOne(function(err, settings){
			if(err){
				console.log("Can't get settings");
				res.redirect("/");
			} else {
				res.redirect(settings.domain+'/cloud/#/r/account');
			}

		});
	});

	apiRoutes.get('/cancel/:id', function(req, res){
		db.settings.findOne(function(err, settings){
			if(err){
				console.log("Can't get settings");
				res.redirect("/");
			} else {
				res.redirect(settings.domain+'/cloud/#/r/invoice/'+req.params.id);
			}

		});
	});

	apiRoutes.get('/list', tools.checkToken, function(req, res){
		var cObject = {};
		getSettings(cObject).
		then(setPaypal).
		then(listTCO).
		then(transposeTCO).
		then(fixUsers).
		then(getUsers).
		then(matchUsers).
		then(function(result){
			//console.log("We resulted", result);
			//console.log("TRXLIST:", result.transactionList);
			res.send(result.invoiceList);
		}).
		fail(function(issue){
			//console.log("We issued");
			//console.log(issue);
			res.status(500).json({status:"fail", message:issue});
		});
	});

	app.use('/api/payment/paypal', apiRoutes);
};

function getSettings(cObject){
	if(!cObject) cObject = {};
	var deferred = Q.defer();
	db.settings.findOne(function(err, settings){
		if(err){
			deferred.reject({onFunction:"getSettings", err:err});
		} else {
			console.log(settings);
			cObject.settings = settings;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function setPaypal(cObject){
	var deferred = Q.defer();
	return false;
	if(!cObject){ deferred.reject({onFunction:"setPaypal", err:"No Object Passed"}); return deferred.promise;}
	cObject.paypal = require('paypal-rest-sdk');
	cObject.paypal.configure({

	});/* = new Twocheckout({
		apiUser: 	cObject.settings.tco.username, 										// Admin API Username, required for Admin API bindings
		apiPass: 	cObject.settings.tco.password, 										// Admin API Password, required for Admin API bindings
		sellerId: 	cObject.settings.tco.sellerid, 										// Seller ID, required for all non Admin API bindings
		privateKey:	cObject.settings.tco.privatekey, 									// Payment API private key, required for checkout.authorize binding
		secretWord: cObject.settings.tco.secret, 											// Secret Word, required for response and notification checks
		demo: 		cObject.settings.tco.isdemo.toString() === 'true', 			// Set to true if testing response with demo sales
		sandbox: 	cObject.settings.tco.issandbox.toString() === 'true' 			// Uses 2Checkout sandbox URL for all bindings
	});*/
	deferred.resolve(cObject);
	return deferred.promise;
}

function parseTrx(transaction){
	var toReturn = {};
	toReturn.id 		= transaction.txn_id;
	toReturn.amount 	= transaction.payment_gross;
	toReturn.fee 		= transaction.payment_fee;
	toReturn.method	= 'PayPal';
	toReturn.date		= transaction.payment_date;
	return toReturn;
}

function parseTrx(transaction){
	var toReturn = {};
	/* This happens with the IPN */
	console.log("XXXXXXXXXXXXXXXXXXXXX==IPN");
	toReturn.id 		= transaction.txn_id;
	toReturn.amount 	= transaction.payment_gross;
	toReturn.fee 		= transaction.payment_fee;
	toReturn.userid	= transaction.item_name.toString().replace("Account: ", "");
	toReturn.detail   = "Payment made";
	if(transaction.payment_status == "Refunded"){
		toReturn.amount = (-1) * transaction.mc_gross;
		toReturn.detail = "Refund issued.";
	} else if(transaction.payment_status != "Completed"){
		toReturn.amount = 0;
		toReturn.detail = transaction.payment_status + '||' + transaction.pending_reason;
	}
	toReturn.method		= 'PayPal';
	toReturn.date			= new Date();
	toReturn.feeChecked 	= false;
	console.log(transaction);
	console.log(toReturn);
	return toReturn;
}