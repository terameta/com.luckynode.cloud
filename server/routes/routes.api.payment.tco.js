var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var Twocheckout 	= require('2checkout-node');
var moment			= require('moment');
var invoiceModule;

module.exports = function(app, express, refdb, tools) {
	db = refdb;

	var apiRoutes 		= express.Router();
	//var querystring 	= require("querystring");
	invoiceModule 		= require('../modules/module.invoice.js')(db);

	apiRoutes.post('/IPN',  function(req, res) {
		refresh2CO();
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
		refresh2CO();
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
		refresh2CO().
		then(function(result){
			//console.log("We resulted", result);
			//console.log("TRXLIST:", result.transactionList);
			res.send(result.invoiceList);
		}).
		fail(function(issue){
			console.log("We issued");
			console.log(issue);
			res.status(500).json({status:"fail", message:issue});
		});
	});

	app.use('/api/payment/tco', apiRoutes);
};

function refresh2CO(){
	var deferred = Q.defer();
	var cObject = {};
	getSettings(cObject).
	then(setTCO).
	then(listTCO).
	then(transposeTCO).
	then(fixUsers).
	then(getUsers).
	then(matchUsers).
	then(updateTRXonDB).
	then(deferred.resolve).
	fail(deferred.reject);
	return deferred.promise;
}

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
	console.log('Settings received');
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
			data.sale_summary.forEach(function(ss){
				console.log('Sale Summary:', ss);
			});
			cObject.transactionList = cObject.transactionList.concat(data.sale_summary);
			console.log("Cur Page:", data.page_info.cur_page);
			console.log("LastPage:", data.page_info.last_page);
			if(parseInt(data.page_info.cur_page, 10) < parseInt(data.page_info.last_page, 10)){
				console.log("There are more records to come");
				deferred.resolve(listTCO(cObject, ++listPage));
			} else {
				deferred.resolve(detailTCO(cObject));
			}
		}
	});
	return deferred.promise;
}

function detailTCO(cObject){
	var promises = [];
	var topDeferred = Q.defer();
	cObject.transactionList.forEach(function(curTrx, curIndex){
		var deferred = Q.defer();
		promises.push(deferred.promise);
		cObject.tco.sales.retrieve({sale_id:curTrx.sale_id}, function(err, data){
			if(err){
				console.log(err);
				deferred.reject(err);
			} else {
				console.log("Pulled ", curTrx.sale_id, curIndex);
				curTrx.fullDetail = data;
				deferred.resolve(data);
			}
		});
	});
	Q.all(promises).then(function(){topDeferred.resolve(cObject)}).fail(topDeferred.reject);
	return topDeferred.promise;
}

function transposeTCO(cObject){
	var deferred = Q.defer();
	cObject.invoiceList = [];
	cObject.transactionList.forEach(function(curTrx){
		curTrx.fullDetail.sale.invoices.forEach(function(curInvoice){
			// console.log(curInvoice);
			curInvoice.customer_email = curTrx.fullDetail.sale.customer.email_address;
			curInvoice.pay_method = curTrx.fullDetail.sale.customer.pay_method;
			console.log(curInvoice.invoice_id, " will be recalculated with #lineitems:", curInvoice.lineitems.length);
			curInvoice.calculatedTotal = 0;
			curInvoice.lineitems.forEach(function(curLineItem){
				console.log(curInvoice.invoice_id, curLineItem.billing.status, curLineItem.billing.usd_amount);
				if(curLineItem.billing.status == "bill"){
					curInvoice.calculatedTotal += parseFloat(curLineItem.usd_amount);
				}
				if(curLineItem.billing.status == "refund"){
					curInvoice.calculatedTotal -= parseFloat(curLineItem.usd_amount);
				}
			});
			if(curInvoice.calculatedTotal == 0){
				curInvoice.calculatedFee = 0;
			} else {
				curInvoice.calculatedFee = parseFloat(curInvoice.fees_2co);
			}
			console.log(curInvoice.invoice_id, curInvoice.calculatedTotal, curInvoice.calculatedFee);
			curInvoice.id = curInvoice.invoice_id;
			curInvoice.amount = curInvoice.calculatedTotal;
			curInvoice.fee = curInvoice.calculatedFee;
			curInvoice.detail = curInvoice.status;
			curInvoice.method = "2CO";
			curInvoice.date = moment(curInvoice.date_placed).toDate();
			curInvoice.feeChecked = true;
			cObject.invoiceList.push(curInvoice);
		});
	});
	cObject.invoiceList.sort(keySorter("customer_name", false));
	deferred.resolve(cObject);
	return deferred.promise;
}

// sort on key values
function keySorter(key,desc) {
  return function(a,b){
   return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
  };
}

function fixUsers(cObject){
	var promises = [];
	var topDeferred = Q.defer();
	db.users.find(function(err, users){
		users.forEach(function(curUser){
			var deferred = Q.defer();
			promises.push(deferred.promise);
			if(!curUser.payemails){
				curUser.payemails = [curUser.email];
				db.users.update({_id:mongojs.ObjectId(curUser._id)}, {$set:{payemails:curUser.payemails}}, function(err, uResult){
					if(err){
						deferred.reject(err);
					} else {
						console.log("User's payemails are updated:", curUser._id);
						deferred.resolve();
					}
				});
			} else {
				console.log("User's payemails are NOT updated:", curUser._id);
				deferred.resolve();
			}
		});
	});
	Q.all(promises).then(function(){topDeferred.resolve(cObject)}).fail(topDeferred.reject);
	return topDeferred.promise;
}

function getUsers(cObject){
	var deferred = Q.defer();
	db.users.find(function(err, users){
		if(err){
			deferred.reject(err);
		} else {
			cObject.users = users;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function matchUsers(cObject){
	var deferred = Q.defer();
	cObject.invoiceList.forEach(function(curInvoice){
		cObject.users.forEach(function(curUser){
			//console.log("Matching for user: ", curUser._id, curUser.payemails);
			curUser.payemails.forEach(function(curemail){
				if(curemail.toString().toLowerCase() == curInvoice.customer_email.toString().toLowerCase()){
					curInvoice.userid = curUser._id.toString();
				}
			});
		});
	});
	//console.log(cObject.transactionList);
	deferred.resolve(cObject);
	return deferred.promise;
}

function updateTRXonDB(cObject){
	var topDeferred = Q.defer();
	var promises = [];
	cObject.invoiceList.forEach(function(curInvoice){
		var deferred = Q.defer();
		promises.push(deferred.promise);
		db.transactions.update({id:curInvoice.id}, { $set:curInvoice }, {upsert:true}, function(err, uresult){
			if(err){
				console.log("Transaction add issue:", err);
				deferred.reject(err);
			} else {
				deferred.resolve();
				console.log("Transaction recorded to account", curInvoice.userid);
			}
		});
	});
	Q.all(promises).then(function(){topDeferred.resolve(cObject)}).fail(topDeferred.reject);
	return topDeferred.promise;
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
			"addrLine2": 		cObject.user.address2,
			"city": 				cObject.user.city,
			"state": 			cObject.user.state,
			"zipCode": 			cObject.user.postcode,
			"country": 			cObject.user.countrycode,
			"email": 			cObject.user.email
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
			console.log("2CO Error");
			console.log(error);
			console.log(error.message);
			deferred.reject(error.message);
		} else {
			cObject.tcoresult = data;
			deferred.resolve(cObject);
		}
		var toInsert = {
			date: new Date(),
			params: params,
			data: data,
			processor: '2CO'
		};
		if(error) toInsert.error = error.toString();
		db.cclogs.insert(toInsert);
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