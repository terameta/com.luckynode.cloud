var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var request 		= require('request');
var querystring 	= require('querystring');
var moment			= require('moment');
var invoiceModule;

module.exports = function(app, express, refdb, tools) {
	db 					= refdb;
	invoiceModule 		= require('../modules/module.invoice.js')(db);
	var apiRoutes 		= express.Router();

	apiRoutes.get('/IPN', function(req, res) {
		res.send("OK");
		refreshPayPal();
	});

	apiRoutes.post('/IPN',  function(req, res) {
		res.send("OK");
		refreshPayPal();
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
		if(isValidObjectID(transaction.userid)){
			db.invoices.update({"details.user":mongojs.ObjectId(transaction.userid)}, {$set:{"details.status":"paid"}}, {multi:true}, function(err, iuresult){
				if(err){
					console.log("Invoices are not updated", err);
				}
			});
		}
	});

	apiRoutes.post('/success/', function(req, res){
		refreshPayPal();
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
		if(isValidObjectID(transaction.userid)){
			db.invoices.update({"details.user":mongojs.ObjectId(transaction.userid)}, {$set:{"details.status":"paid"}}, {multi:true}, function(err, iuresult){
				if(err){
					console.log("Invoices are not updated", err);
				}
			});
		}
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
		refreshPayPal().
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

	app.use('/api/payment/paypal', apiRoutes);
};

function isValidObjectID(str) {
	// A valid Object Id must be 24 hex characters
	return (/^[0-9a-fA-F]{24}$/).test(str);
}

function refreshPayPal(){
	var deferred = Q.defer();
	var cObject = {};
	getSettings(cObject).
	then(setPaypal).
	then(listPaypal).
	then(fixUsers).
	then(getUsers).
	then(matchUsers).
	then(filterUsers).
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
			//console.log(settings);
			cObject.settings = settings;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function setPaypal(cObject){
	var deferred = Q.defer();
	if(!cObject){ deferred.reject({onFunction:"setPaypal", err:"No Object Passed"}); return deferred.promise;}
	/*cObject.paypal = require('paypal-rest-sdk');
	cObject.paypal.configure({
		'mode': (cObject.settings.paypal.issandbox === 'true' ? 'sandbox' : 'live'),
		'client_id': cObject.settings.paypal.clientid,
		'client_secret': cObject.settings.paypal.secret
	});
	console.log("=============================================================");
	console.log("=============================================================");
	console.log("SetPaypal: ", (cObject.settings.paypal.issandbox === 'true' ? 'sandbox' : 'live'));
	console.log("=============================================================");
	console.log("=============================================================");
	*/
	deferred.resolve(cObject);
	return deferred.promise;
}

function listPaypal(cObject, listDate, listPeriod){
	var deferred = Q.defer();
	if(!cObject){ deferred.reject({onFunction:"listPaypal", err:"No Object Passed"}); return deferred.promise;}
	//if(!cObject.paypal){ deferred.reject({onFunction:"listPaypal", err:"No Paypal detail passed in the object"}); return deferred.promise;}
	if(!listDate) listDate = moment().add(1,'days').startOf('day');
	if(!listPeriod) listPeriod = 'weeks';
	var startdate = moment(listDate).subtract(1, listPeriod).format('YYYY-MM-DDTHH:mm:ss').toString()+'Z';
	var enddate = listDate.format('YYYY-MM-DDTHH:mm:ss').toString()+'Z';
	var companystart = moment().subtract(1,'months').startOf('day');
	var shouldContinue = listDate.diff(companystart);
	console.log("*************************************************************");
	console.log("List Period:", listPeriod);
	console.log("List Date  :", listDate.format('YYYY-MM-DDTHH:mm:ss').toString()+'Z');
	console.log("Start Date :", startdate);
	console.log("End Date   :", enddate);
	console.log("CompanyDate:", companystart.format('YYYY-MM-DDTHH:mm:ss').toString()+'Z');
	console.log("ShouldConti:", shouldContinue);

	var data = {
		USER:cObject.settings.paypal.username,
		PWD:cObject.settings.paypal.password,
		SIGNATURE:cObject.settings.paypal.signature,
		METHOD:'TransactionSearch',
	//	RECEIVER:'admin@epmvirtual.com',
		STARTDATE:startdate,  					//'2016-04-01T00:00:01Z',
		ENDDATE:enddate, 							//'2016-04-29T00:00:01Z',
		VERSION:94
	};

	request.post({url:'https://api-3t.paypal.com/nvp', form: data, gzip: true}, function(err,httpResponse,body){
		if(err){
			console.log("Error: ", err);
			deferred.reject(err);
		} else {
			var result = querystring.parse(body, null, null, {maxKeys:0});
			/*
				From official nodejs docs:
				Options object may contain maxKeys property (equal to 1000 by default), it'll be used to limit processed keys. Set it to 0 to remove key count limitation.
			*/
			//console.log(result);
			console.log("=======================================================");
			console.log(result.ACK);
			console.log(result);
			console.log("=======================================================");
			if(!cObject.invoiceList) cObject.invoiceList = [];
			var curTrx = {};
			if(result.ACK != "Success"){
				if( listPeriod == 'hours' 		) listPeriod = 'minutes';
				if( listPeriod == 'days' 		) listPeriod = 'hours';
				if( listPeriod == 'weeks' 		) listPeriod = 'days';
				if( listPeriod == 'months' 	) listPeriod = 'weeks';
				if( listPeriod == 'quarters' 	) listPeriod = 'months';
				if( listPeriod == 'years'		) listPeriod = 'quarters';
				deferred.resolve(listPaypal(cObject, listDate, listPeriod));
			} else if(result.L_TIMESTAMP){
				curTrx = {
					id:result.L_TRANSACTIONID,
					amount: parseFloat(result.L_AMT),
					fee: parseFloat(result.L_FEEAMT),
					net: parseFloat(result.L_NETAMT),
					currency: result.L_CURRENCYCODE,
					userid: "pleasefind",
					detail: result.L_TYPE,
					status: result.L_STATUS,
					email: result.L_EMAIL,
					counterpartname: result.L_NAME,
					method: "PayPal",
					date: result.L_TIMESTAMP,
					feeChecked: true
				};
				cObject.invoiceList.push(curTrx);
			} else if(result.L_TIMESTAMP0){
				for(var i = 0; i < 100; i++){
					if(!result["L_TIMESTAMP"+i]){ break; }
					curTrx = {};
					curTrx = {
						id:result["L_TRANSACTIONID"+i],
						amount: parseFloat(result["L_AMT"+i]),
						fee: parseFloat(result["L_FEEAMT"+i]),
						net: parseFloat(result["L_NETAMT"+i]),
						currency: result["L_CURRENCYCODE"+i],
						userid: "pleasefind",
						detail: result["L_TYPE"+i],
						status: result["L_STATUS"+i],
						email: result["L_EMAIL"+i],
						counterpartname: result["L_NAME"+i],
						method: "PayPal",
						date: result["L_TIMESTAMP"+i],
						feeChecked: true
					};
					cObject.invoiceList.push(curTrx);
				}
			}
			console.log(cObject.invoiceList.length);
			console.log(curTrx);

			if(result.ACK == "Success"){
				listDate = listDate.subtract(1, listPeriod);

				if(shouldContinue >=0){
					console.log("We will continue");
					deferred.resolve(listPaypal(cObject, listDate, listPeriod));
				} else {
					console.log("We will not continue");
					deferred.resolve(cObject);
				}
			}
		}
	});
	return deferred.promise;
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
						//console.log("User's payemails are updated:", curUser._id);
						deferred.resolve();
					}
				});
			} else {
				//console.log("User's payemails are NOT updated:", curUser._id);
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
			console.log(">>>Function getUsers (error):", err);
			deferred.reject(err);
		} else {
			console.log(">>>Function getUsers completed");
			cObject.users = users;
			deferred.resolve(cObject);
		}
	});
	return deferred.promise;
}

function matchUsers(cObject){
	var deferred = Q.defer();
	cObject.invoiceList.forEach(function(curInvoice){
		if(curInvoice.email){
			cObject.users.forEach(function(curUser){
			//	console.log(">>>Checking Emails for user:", curUser._id, curUser.payemails);
				curUser.payemails.forEach(function(curemail){
					if(curemail.toString().toLowerCase() == curInvoice.email.toString().toLowerCase()){
						curInvoice.userid = curUser._id.toString();
					}
				});
			});
		}
	});
	//console.log(cObject.transactionList);
	deferred.resolve(cObject);
	return deferred.promise;
}

function filterUsers(cObject){
	var deferred = Q.defer();
	var newInvoices = [];
	var shouldAppend;
	cObject.invoiceList.forEach(function(curInvoice){
		shouldAppend = true;
		if(curInvoice.detail == "Currency Conversion (debit)") shouldAppend = false;
		if(curInvoice.detail == "Currency Conversion (credit)") shouldAppend = false;
		if(curInvoice.detail == "Transfer" && !curInvoice.email ) shouldAppend = false;
		if(curInvoice.email == "paypal@hetzner.de") shouldAppend = false;
		if(curInvoice.email == "fxpaypalsales@2co.com") shouldAppend = false;
		if(curInvoice.email == "paypal.ae@aramex.com") shouldAppend = false;
		if(curInvoice.email == "paypal@digitalocean.com") shouldAppend = false;
		if(curInvoice.email == "paypal@dreamhost.com") shouldAppend = false;
		if(curInvoice.email == "paypal_owner@elance.com") shouldAppend = false;
		if(curInvoice.email == "paypal@envato.com") shouldAppend = false;
		if(curInvoice.email == "paypal@fiverr.com") shouldAppend = false;
		if(curInvoice.email == "paypalbig@fiverr.com") shouldAppend = false;
		if(curInvoice.email == "paypal@hetzner.de") shouldAppend = false;
		if(curInvoice.email == "paypal@manning.com") shouldAppend = false;
		if(curInvoice.email == "billing@soluslabs.com") shouldAppend = false;
		if(curInvoice.email == "paypal-ca-admin@ovh.ca") shouldAppend = false;
		if(curInvoice.email == "ecom.paypal@penti.com.tr") shouldAppend = false;
		if(curInvoice.email == "nicheweirdo@gmail.com") shouldAppend = false;
		if(curInvoice.email == "shahulhameed184@yahoo.com") shouldAppend = false;
		if(curInvoice.email == "shameel_13@yahoo.com") shouldAppend = false;
		if(curInvoice.email == "social@sharedesk.net") shouldAppend = false;
		if(curInvoice.email == "billing@singlehop.com") shouldAppend = false;
		if(curInvoice.email == "payments@siteorigin.com") shouldAppend = false;
		if(curInvoice.email == "h@softaculous.com") shouldAppend = false;
		if(curInvoice.email == "paypal@sonetel.com") shouldAppend = false;
		if(curInvoice.email == "info@statuspeople.com") shouldAppend = false;
		if(curInvoice.email == "mb@screencastify.com") shouldAppend = false;
		if(curInvoice.email == "billing@whmcs.com") shouldAppend = false;
		if(curInvoice.email == "badoo-paypal@corp.badoo.com") shouldAppend = false;
		if(curInvoice.email == "paypal-releve-int@gandi.net") shouldAppend = false;
		if(curInvoice.email == "paypal@souq.com") shouldAppend = false;
		if(!curInvoice.email ) shouldAppend = false;
		if(shouldAppend) newInvoices.push(curInvoice);
	});
	cObject.invoiceList = newInvoices;
	deferred.resolve(cObject);
	return deferred.promise;
}

function updateTRXonDB(cObject){
	var topDeferred = Q.defer();
	var promises = [];
	cObject.invoiceList.forEach(function(curInvoice){
		curInvoice.fee = parseFloat(curInvoice.fee) * (-1);
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