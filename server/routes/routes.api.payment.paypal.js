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
		then(listPaypal).
	/*	then(transposeTCO).
		then(fixUsers).
		then(getUsers).
		then(matchUsers).*/
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
	cObject.paypal = require('paypal-rest-sdk');
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
	deferred.resolve(cObject);
	return deferred.promise;
}

function listPaypal(cObject, listDate){
	var deferred = Q.defer();
	if(!cObject){ deferred.reject({onFunction:"listPaypal", err:"No Object Passed"}); return deferred.promise;}
	if(!cObject.paypal){ deferred.reject({onFunction:"listPaypal", err:"No Paypal detail passed in the object"}); return deferred.promise;}
	if(!listDate) listDate = moment().add(1,'days').startOf('day');
	var startdate = listDate.startOf('day').format('YYYY-MM-DDTHH:mm:ss').toString()+'Z';
	var enddate = listDate.endOf('day').format('YYYY-MM-DDTHH:mm:ss').toString()+'Z';
	var companystart = moment(cObject.settings.companystart).subtract(1,'days').startOf('day');
	var shouldContinue = listDate.diff(companystart);

	var data = {
		USER:cObject.settings.paypal.username,
		PWD:cObject.settings.paypal.password,
		SIGNATURE:cObject.settings.paypal.signature,
		METHOD:'TransactionSearch',
		STARTDATE:startdate,  					//'2016-04-01T00:00:01Z',
		ENDDATE:enddate, 							//'2016-04-29T00:00:01Z',
		VERSION:94
	};

	request.post({url:'https://api-3t.paypal.com/nvp', form: data, gzip: true}, function(err,httpResponse,body){
		if(err){
			console.log("Error: ", err);
			deferred.reject(err);
		} else {
			console.log("=======================================================");
			console.log("=======================================================");
			var result = querystring.parse(body, null, null, {maxKeys:0});
			/*
				From official nodejs docs:
				Options object may contain maxKeys property (equal to 1000 by default), it'll be used to limit processed keys. Set it to 0 to remove key count limitation.
			*/
			console.log(result);
			console.log("=======================================================");
			console.log("=======================================================");
			if(!cObject.invoiceList) cObject.invoiceList = [];
			var curTrx = {};
			if(result.L_TIMESTAMP){
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
			console.log("Company Date:", companystart.format('YYYY-MM-DDTHH:mm:ss').toString()+'Z');
			console.log("List Date   :", listDate.format('YYYY-MM-DDTHH:mm:ss').toString()+'Z');
			console.log("Start Date  :", startdate);
			console.log("End Date    :", enddate);
			console.log("Should Cont.:", shouldContinue);
			listDate = listDate.subtract(1,'days');

			if(shouldContinue >=0){
				console.log("We will continue");
				deferred.resolve(listPaypal(cObject, listDate));
			} else {
				console.log("We will not continue");
				deferred.resolve(cObject);
			}
		}
	});
	/*
	console.log("=======================================================");
	console.log("=======================================================");
	console.log(startdate);
	console.log(enddate);
	console.log(companystart.format('YYYY-MM-DDTHH:mm:ss').toString()+'Z');
	console.log("Difference between dates:", shouldContinue);
	console.log("=======================================================");
	console.log("=======================================================");

	*/

/*
	cObject.paypal.payment.list({ "count": 20 }, function(error, payment) {
		if (error) {
			throw error;
		} else {
			cObject.invoiceList = payment;
			console.log("List Payments Response");
			console.log(JSON.stringify(payment));
			deferred.resolve(cObject);
		}
	});
	/*
	listPage = listPage || 1;
	console.log("Currently listing 2CO Page: ", listPage);

	cObject.tco.sales.list({pagesize:"100", sort_col:"date_placed", sort_dir:"ASC", cur_page:listPage}, function(err, data){
		if(err){
			deferred.reject({onFunction:"listTCO", err:err});
		} else {
			if(!cObject.transactionList) cObject.transactionList = [];
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
	});*/
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