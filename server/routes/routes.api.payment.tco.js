var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var Twocheckout 	= require('2checkout-node');
var invoiceModule;

module.exports = function(app, express, refdb, tools) {
	db = refdb;

	var apiRoutes 		= express.Router();
	//var querystring 	= require("querystring");
	invoiceModule 		= require('../modules/module.invoice.js')(db);

	apiRoutes.post('/IPN',  function(req, res) {

		console.log("==========================================================");
		console.log("==========================================================");
		console.log("IPN Body");
		console.log(req.body);
		console.log("==========================================================");
		console.log("==========================================================");

		setInvoice({tcoresult:req.body});
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


	apiRoutes.post('/pay/', tools.checkUserToken, function(req, res){
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
			then(getBalance).
			then(chargeCard).
			then(setInvoice).
			then(function(result){ res.send("OK"); }).
			fail(function(issue){
				console.log(issue);
				res.status(500).json({status:"fail", detail:issue});
			});
		}
	});

	apiRoutes.get('/list', tools.checkToken, function(req, res){
		var cObject = {};
		getSettings(cObject).
		then(setTCO).
		then(listTCO).
		then(function(result){
			res.send(result.transactionList);
		}).
		fail(function(issue){
			console.log(issue);
			res.status(500).json({status:"fail", message:issue});
		});
	});

	app.use('/api/payment/tco', apiRoutes);
};

function getSettings(cObject){
	if(!cObject) cObject = {};
	var deferred = Q.defer();
	db.settings.findOne(function(err, settings){
		if(err){
			deferred.reject({onFunction:"getSettings", err:err});
		} else {
			cObject.settings = settings;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function setTCO(cObject){
	var deferred = Q.defer();
	if(!cObject){ deferred.reject({onFunction:"setTCO", err:"No Object Passed"}); return deferred.promise;}
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

function listTCO(cObject, listPage){
	var deferred = Q.defer();
	listPage = listPage || 1;
	console.log("Currently listing 2CO Page: ", listPage);
	if(!cObject){ deferred.reject({onFunction:"listTCO", err:"No Object Passed"}); return deferred.promise;}
	if(!cObject.tco){ deferred.reject({onFunction:"listTCO", err:"No TCO detail passed in the object"}); return deferred.promise;}

	cObject.tco.sales.list({pagesize:"100", sort_col:"date_placed", sort_dir:"ASC", cur_page:listPage}, function(err, data){
		if(err){
			deferred.reject({onFunction:"listTCO", err:err});
		} else {
			if(!cObject.transactionList) cObject.transactionList = [];
			cObject.transactionList = cObject.transactionList.concat(data.sale_summary);
			console.log("Cur Page:", data.page_info.cur_page);
			console.log("LastPage:", data.page_info.last_page);
			if(parseInt(data.page_info.cur_page, 10) < parseInt(data.page_info.lastModifiedDate, 10)){
				console.log("There are more records to come");
				deferred.resolve(listTCO(cObject, ++listPage));
			} else {
				deferred.resolve(cObject);
			}
		}
	});
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

function getBalance(cObject){
	if(!cObject) cObject = {};
	var deferred = Q.defer();
	cObject.userid = cObject.user._id.toString();
	invoiceModule.getUserBalance(cObject).then(deferred.resolve).fail(deferred.reject);
	return deferred.promise;
}

function chargeCard(cObject){
	var deferred = Q.defer();
	//console.log("We are at chargeCard", cObject);
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
		price: 					Number(parseFloat(cObject.accountBalance).toFixed(2)),
		quantity: 				1,
		name: 					'Account: ' + cObject.userid,
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
	var transaction = parseTrx(cObject.tcoresult);
	db.transactions.update({id:transaction.id}, { $set:transaction }, {upsert:true}, function(err, uresult){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(cObject);
		}
	});
	db.invoices.update({"details.user":mongojs.ObjectId(transaction.userid)}, {$set:{"details.status":"paid"}}, {multi:true}, function(err, iuresult){
		if(err){
			console.log("Invoices are not updated", err);
		}
	});
	return deferred.promise;
}

function parseTrx(transaction){
	var toReturn = {};
	if(transaction.response){
		/* This happens immediately after transaction has occured */
		console.log("XXXXXXXXXXXXXXXXXXXXX==Transaction");
		toReturn.id 		= transaction.response.transactionId;
		toReturn.amount 	= transaction.response.total;
		toReturn.fee 		= 0;
		toReturn.userid	= transaction.response.lineItems[0].name.toString().replace("Account: ", "");
	} else {
		/* This happens with the IPN */
		console.log("XXXXXXXXXXXXXXXXXXXXX==IPN");
		toReturn.id 		= transaction.invoice_id;
		toReturn.amount 	= transaction.item_list_amount_1;
		toReturn.fee 		= 0;
		toReturn.userid	= transaction.item_name_1.toString().replace("Account: ", "");
		toReturn.detail   = "Payment made";
		if(transaction.message_type == "REFUND_ISSUED"){
			toReturn.amount = (-1) * toReturn.amount;
			toReturn.detail = "Refund issued.";
		} else if(transaction.fraud_status != "pass"){
			toReturn.amount = 0;
			toReturn.detail = transaction.message_type + '||' + transaction.message_description;
		}
	}
	toReturn.method		= '2CO';
	toReturn.date			= new Date();
	toReturn.feeChecked 	= false;
	console.log(transaction);
	console.log(toReturn);
	return toReturn;
}