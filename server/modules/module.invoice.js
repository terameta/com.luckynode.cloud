var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var moment			= require('moment');
var pdf 				= require('html-pdf');
var tools;
var templateModule;

module.exports = function(refdb){
	db = refdb;
	templateModule = require("../modules/module.template.js")(db);
	tools = require("../tools/tools.main.js")(db);
	var module = {
		startProcess	: startProcess,
		list				: list,
		getUserBalance : getUserBalance,
		fetchOne			: fetchOne
	};
	return module;
};

function getUserBalance(refObj){
	var deferred = Q.defer();
	//console.log("We are at getUserBalance", refObj);
	if(!refObj){
		deferred.reject("No information passed");
		return deferred.promise;
	}
	listToObject(refObj).
	then(getUserTransactions).
	then(calculateUserBalance).
	then(deferred.resolve).
	fail(deferred.reject);
	return deferred.promise;
}

function calculateUserBalance(refObj){
	var deferred = Q.defer();
	var accountBalance = 0;
	var allTransactions = [];
	if(refObj.invoiceList){
		refObj.invoiceList.forEach(function(curInvoice){
			//console.log("Invoice:::", curInvoice);
			accountBalance += parseFloat(curInvoice.netTotal);
			allTransactions.push({id:curInvoice._id, date:curInvoice.details.date, transactionBy:'Invoice', amountSpent:curInvoice.netTotal, details:'Invoice Generated'});
		});
	}
	if(refObj.transactions){
		refObj.transactions.forEach(function(curTrx){
			//console.log("Transaction:::", curTrx);
			accountBalance -= parseFloat(curTrx.amount);
			allTransactions.push({id:curTrx.id, date:curTrx.date, transactionBy:curTrx.method, amountPaid:curTrx.amount, details:curTrx.detail});
		});
	}
	refObj.accountBalance = accountBalance;
	refObj.transactions = allTransactions;
	delete refObj.invoiceList;
	deferred.resolve(refObj);
	return deferred.promise;
}

function getUserTransactions(refObj){
	var deferred = Q.defer();
	db.transactions.find({userid:refObj.userid}, function(err, trxList){
		if(err){
			deferred.reject(err);
		} else {
			refObj.transactions = trxList;
			deferred.resolve(refObj);
		}
	});
	return deferred.promise;
}

function listToObject(refObj){
	var deferred = Q.defer();
	list(refObj.userid).then(function(invoiceList){
		refObj.invoiceList = invoiceList;
		deferred.resolve(refObj);
	}).fail(deferred.reject);
	return deferred.promise;
}

function fetchOne(userid, invoiceid){
	var deferred = Q.defer();
	var querier = {"details.user":mongojs.ObjectId(userid), _id:parseInt(invoiceid,10)};
	if(!userid)	querier = {};
	console.log(querier);
	db.invoices.findOne(querier, function(err, invoice){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(invoice);
		}
	});
	return deferred.promise;
}

function list(userid){
	var deferred = Q.defer();
	var querier = {"details.user":mongojs.ObjectId(userid)};
	if(!userid)	querier = {};
	//console.log(querier);
	db.invoices.find(querier, function(err, invoiceList){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(invoiceList);
		}
	});
	return deferred.promise;
}

function startProcess(){
	console.log("Invoicing process is starting:", new Date());
	assignDate().
	then(processAll).
	then(processAllMail).
	then(function(result){
		tools.logger.info("Invoice process completed:", result);
	});
}

function assignDate(){
	var deferred = Q.defer();
	console.log("Assigning dates");
	db.servers.find( { nextinvoicedate: { $exists: false } }, { createdat:1}, function(err, result) {
		if(err){
			deferred.reject(err);
			console.log("Assigning dates failed");
		} else if(result.length == 0) {
			console.log("Assigning dates: ALL OK, every server is assigned");
			deferred.resolve("All OK");
		} else {
			db.servers.update({_id:result[0]._id, nextinvoicedate: { $exists: false }, invoicestat: {$exists: false} }, { $set:{nextinvoicedate:result[0].createdat, invoicestat:'OK'} }, function(uerr, uresult){
				if(uerr){
					console.log("Assign dates failed at the update");
					deferred.reject(uerr);
				} else {
					console.log(uresult);
					deferred.resolve(assignDate());
				}
			});
		}
	});
	return deferred.promise;
}

function processAll(){
	console.log("We are at processAll");
	var deferred = Q.defer();
	db.servers.find({nextinvoicedate: {$lt: new Date()}, invoicestat: 'OK'},{_id:1}, function(err, result){
		if(err){
			console.log("processAll failed");
			deferred.reject(err);
		} else if(result.length == 0) {
			console.log("No more invoices to process");
			db.servers.find({},{_id:1, nextinvoicedate:1, name:1}, function(err, result){
				result.forEach(function(curServer){
					var momentedInvDate = moment(curServer.nextinvoicedate);
					var momentedCurDate = moment(new Date());
					if(momentedInvDate < momentedCurDate){
						console.log("AAAA", curServer.name, momentedInvDate.format(),"----", momentedCurDate.format());
					} else {
						console.log("BBBB", curServer.name, momentedInvDate.format(),"----", momentedCurDate.format());
					}
				});
			});
			deferred.resolve("No more invoices to process");
		} else {
			console.log("We will now process "+ result.length);
			locknProcessCurrent(result[0]._id).then(function(result){
				deferred.resolve(processAll());
			}).fail(deferred.reject);
		}
	});
	return deferred.promise;
}

function locknProcessCurrent(id){
	var deferred = Q.defer();
	db.servers.update({_id:mongojs.ObjectId(id), invoicestat:'OK'}, { $set:{invoicestat:'Processing'}}, function(err, result){
		if(err){
			deferred.reject(err);
		} else {
			console.log(id, result);
			if(result.nModified){
				deferred.resolve(processCurrent(id));
			} else {
				deferred.resolve(id);
			}
		}
	});
	return deferred.promise;
}

function processCurrent(id){
	var deferred = Q.defer();
	console.log("ProcessCurrent",id);
	var tokenObject = {};
	tokenObject.id = id;
	findPrice(tokenObject).
	then(findDiscount).
	then(findPayTo).
	then(getInvoiceNumber).
	then(createInvoice).
	then(moveServerDate).
	then(calculateInvoiceTotal).
	then(deferred.resolve).
	fail(function(issue){
		console.log("Failed", issue);
		deferred.reject(issue);
	});
	return deferred.promise;
}

function findPrice(tokenObject){
	var deferred = Q.defer();
	//console.log(tokenObject);
	db.servers.findOne({_id:mongojs.ObjectId(tokenObject.id)}, function(err, server){
		if(err){
			deferred.reject(err);
		} else if(!server) {
			deferred.reject("No given server " + tokenObject.id);
		} else {
			tokenObject.server = server;
			if(server.price){
				deferred.resolve(tokenObject);
			} else {
				db.plans.findOne({_id:mongojs.ObjectId(server.plan)}, function(err, plan){
					if(err){
						deferred.reject(err);
						console.log("No plan assigned for the server:", tokenObject.id);
					} else {
						db.servers.update({_id:mongojs.ObjectId(tokenObject.id)}, {$set: {price: plan.price}}, function(uerr, uresult) {
							if(uerr){
								deferred.reject(uerr);
							} else {
								tokenObject.server.price = plan.price;
								deferred.resolve(tokenObject);
							}
						});
					}
				});
			}
		}
	});
	return deferred.promise;
}

function findDiscount(tokenObject){
	var deferred = Q.defer();
	//console.log("FindDiscount", tokenObject);
	db.users.findOne({_id:mongojs.ObjectId(tokenObject.server.owner)}, function(err, user){
		if(err){
			deferred.reject(err);
		} else if(!user) {
			deferred.reject("No user found");
		} else {
			tokenObject.user = user;
			//console.log("Server Price:", tokenObject.server.price);
			//console.log("User Discount:", user.discountAmount, user.discountType);
			var discountFromUser = 0;
			if(user.discountAmount){
				//console.log("User Discount Type:", user.discountType);
				if(user.discountType == 'percentage'){
					discountFromUser = parseFloat(tokenObject.server.price) * user.discountAmount / 100;
				} else if(user.discountType == 'currency') {
					discountFromUser = parseFloat(user.discountAmount);
				}
			}
			//console.log("DiscountFromUser:", discountFromUser);
			//console.log("Server Discount:", tokenObject.server._id, tokenObject.server.discountAmount, tokenObject.server.discountType);
			var discountFromServer = 0;
			if(tokenObject.server.discountAmount){
				if(tokenObject.server.discountType == 'percentage'){
					discountFromServer = parseFloat(tokenObject.server.price) * tokenObject.server.discountAmount / 100;
				} else if(tokenObject.server.discountType == 'currency'){
					discountFromServer = parseFloat(tokenObject.server.discountAmount);
				}
			}
			if(discountFromServer < 0) discountFromServer = 0;
			if(discountFromUser < 0) discountFromUser = 0;
			//console.log("DiscountFromServer:", discountFromServer);
			if(discountFromServer > discountFromUser){
				tokenObject.discount = discountFromServer;
				if(discountFromServer > 0){
					tokenObject.discountDescription = 'Server Discount ';
					if(tokenObject.server.discountType == 'percentage') tokenObject.discountDescription += '('+tokenObject.server.discountAmount+'%) ';
				}
			} else {
				tokenObject.discount = discountFromUser;
				if(discountFromUser > 0){
					tokenObject.discountDescription = 'User Discount ';
					if(user.discountType == 'percentage') tokenObject.discountDescription += '('+user.discountAmount+'%) ';
				}
			}
			if(tokenObject.discountDescription){
				tokenObject.discountDescription = tokenObject.discountDescription.trim();
			} else {
				tokenObject.discountDescription = "-";
			}
			//console.log("ZZZ", tokenObject.discount, tokenObject.discountDescription);
			deferred.resolve(tokenObject);
		}
	});
	return deferred.promise;
}

function findPayTo(tokenObject){
	//console.log("FindPayTo", tokenObject);
	var deferred = Q.defer();
	if(tokenObject.user.payto) tokenObject.payTo = tokenObject.user.payto.toString().trim();
	if(tokenObject.payTo){
		deferred.resolve(tokenObject);
	} else {
		db.settings.findOne({}, function(err, settings){
			if(err){
				deferred.reject(err);
			} else {
				tokenObject.payTo = settings.paytotext;
				tokenObject.systemSettings = settings;
				deferred.resolve(tokenObject);
			}
		});
	}
	return deferred.promise;
}

function getInvoiceNumber(tokenObject){
	//console.log("GetInvoiceNumber", tokenObject);
	var deferred = Q.defer();
	db.invoices.findOne({"details.user":mongojs.ObjectId(tokenObject.user._id), "details.status":"Unpaid"}, {_id:1}, function(err, invoice){
		if(err){
			deferred.reject(err);
		} else if(!invoice){
			db.counters.findAndModify({ query: { _id: 'invoicenumber' }, update: { $inc: { seq: 1 } }, new: true }, function(err, result){
				if(err){
					deferred.reject(err);
				} else {
					tokenObject.invoicenumber = result.seq;
					deferred.resolve(tokenObject);
				}
			});
		} else {
			tokenObject.invoicenumber = invoice._id;
			deferred.resolve(tokenObject);
		}
	});
	return deferred.promise;
}

function createInvoice(tokenObject){
	var deferred = Q.defer();
	var curInvoice = {};
	curInvoice.to = tokenObject.user.name+' '+tokenObject.user.surname;
	curInvoice.toAddress = tokenObject.user.address;
	curInvoice.toEmail = tokenObject.user.email;
	curInvoice.number = tokenObject.invoicenumber;
	curInvoice.date = new Date();
	curInvoice.payTo = tokenObject.payTo;
	curInvoice.user = tokenObject.user._id;
	curInvoice.status = 'Unpaid';
	var curInvoiceitem = {};
	curInvoiceitem.name = tokenObject.server.name;
	curInvoiceitem.type = 'Server';
	curInvoiceitem.calculateFrom = tokenObject.server.nextinvoicedate;
	var invoicesta = moment(tokenObject.server.nextinvoicedate);
	var endofmonth = moment().endOf('month');
	var daystoInvo = endofmonth.diff(invoicesta, 'days', true);
	var numDaysMon = parseInt(endofmonth.format('D'), 10);
	curInvoiceitem.multiplier = daystoInvo / numDaysMon;
	curInvoiceitem.calculateTo = endofmonth.toDate();
	curInvoiceitem.between = '( '+invoicesta.format('lll')+' - '+endofmonth.format('lll')+' )';
	curInvoiceitem.price = tokenObject.server.price;
	curInvoiceitem.discount = tokenObject.discount;
	curInvoiceitem.discountDescription = tokenObject.discountDescription;
	curInvoiceitem.finalPrice = parseFloat(curInvoiceitem.price) * curInvoiceitem.multiplier;
	curInvoiceitem.finalDiscount = parseFloat(curInvoiceitem.discount) * curInvoiceitem.multiplier;
	curInvoiceitem.finalNet = parseFloat(curInvoiceitem.finalPrice) - parseFloat(curInvoiceitem.finalDiscount);
	db.invoices.update({_id:tokenObject.invoicenumber}, { $set:{ details:curInvoice }, $push:{ items: curInvoiceitem } }, { upsert: true }, function(err, result){
		if(err){
			console.log(err);
			deferred.reject(err);
		} else {
			tokenObject.invoice = curInvoice;
			tokenObject.invoiceitem = curInvoiceitem;
			deferred.resolve(tokenObject);
		}
	});
	return deferred.promise;
}

function calculateInvoiceTotal(tokenObject){
	var deferred = Q.defer();
	db.invoices.findOne({_id:tokenObject.invoicenumber}, function(err, curInvoice){
		console.log(curInvoice.items);
		var priceTotal = 0;
		var discountTotal = 0;
		var netTotal = 0;
		curInvoice.items.forEach(function(curItem){
			priceTotal += parseFloat(curItem.finalPrice);
			discountTotal += parseFloat(curItem.finalDiscount);
		});
		netTotal += parseFloat(priceTotal) - parseFloat(discountTotal);
		netTotal = parseFloat(netTotal).toFixed(2);
		db.invoices.update({_id:tokenObject.invoicenumber}, {$set:{priceTotal:priceTotal, discountTotal:discountTotal, netTotal:netTotal}}, function(err, result){
			if(err){
				deferred.reject(err);
			} else {
				deferred.resolve(tokenObject);
			}
		});
	});
	return deferred.promise;
}

function moveServerDate(tokenObject){
	var deferred = Q.defer();
	var setTo = moment(tokenObject.invoiceitem.calculateTo).add(1,'days').startOf('month').toDate();
	db.servers.update({_id:mongojs.ObjectId(tokenObject.server._id)}, { $set:{invoicestat:'OK', nextinvoicedate:setTo}}, function(err, result){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(tokenObject);
		}
	});
	return deferred.promise;
}

function processAllMail(){
	var deferred = Q.defer();
	db.invoices.find({ sendstatus: { $exists: false } },{_id:1}, function(err, result){
		if(err){
			deferred.reject(err);
		} else if(result.length == 0) {
			deferred.resolve("No more invoices to send mail");
		} else {
			console.log("We will now process "+ result.length);
			locknProcessMail(result[0]._id).then(function(result){
				deferred.resolve(processAllMail());
			}).fail(deferred.reject);
		}
	});
	return deferred.promise;
}

function locknProcessMail(id){
	var deferred = Q.defer();
	db.invoices.update({_id:parseInt(id,10)}, { $set:{sendstatus:'Processing'}}, function(err, result){
		if(err){
			deferred.reject(err);
		} else {
			console.log(id, result);
			if(result.nModified){
				deferred.resolve(sendInvoice(id));
			} else {
				deferred.resolve(id);
			}
		}
	});
	return deferred.promise;
}

function sendInvoice(id){
	var deferred = Q.defer();
	var mObject = {invoiceID:id};
	getSystemSettings(mObject).
	then(getInvoiceDetails).
	then(getUserDetails).
	then(setupMailObject).
	then(setupMailPDF).
	then(sendInvoiceMail).
	then(deferred.resolve).
	fail(function(issue){
		console.log(issue);
		deferred.reject(issue);
	});
	deferred.resolve("OK");
	return deferred.promise;
}

function getSystemSettings(mObject){
	var deferred = Q.defer();
	db.settings.findOne({}, function(err, settings){
		if(err){
			deferred.reject(err);
		} else if(!settings) {
			deferred.reject("No system settings");
		} else {
			mObject.settings = settings;
			deferred.resolve(mObject);
		}
	});
	return deferred.promise;
}

function getInvoiceDetails(mObject){
	var deferred = Q.defer();
	db.invoices.findOne({_id:parseInt(mObject.invoiceID, 10)}, function(err, invoice){
		if(err){
			deferred.reject(err);
		} else if(!invoice){
			deferred.reject("No invoice found");
		} else {
			mObject.invoice = invoice;
			deferred.resolve(mObject);
		}
	});
	return deferred.promise;
}

function getUserDetails(mObject){
	var deferred = Q.defer();
	db.users.findOne({_id:mongojs.ObjectId(mObject.invoice.details.user)}, function(err, user) {
		if(err){
			console.log("Error getUserDetails",err);
			deferred.reject(err);
		} else if(!user){
			deferred.reject("User is not found");
		} else {
			mObject.user = user;
			deferred.resolve(mObject);
		}
	});
	return deferred.promise;
}

function setupMailObject(mObject){
	var deferred = Q.defer();
	mObject.from = mObject.settings.companyname+' Accounting <'+mObject.settings.accountingemail+'>';
	mObject.subject = mObject.settings.companyname+' Invoice for '+moment(mObject.invoice.details.date).format('DD MMM YYYY');
	mObject.to = mObject.invoice.details.toEmail;
	mObject.content = 'Dear ' + mObject.user.name + ';<br>';
	mObject.content +='<br>';
	mObject.content +='You can kindly find your invoice as attached.<br>';
	mObject.content +='<br>';
	mObject.content +='Best regards<br>';
	mObject.content +='Accounting Team - '+mObject.settings.companyname;

	console.log(mObject);
	deferred.resolve(mObject);
	return deferred.promise;
}

function setupMailPDF(mObject){
	var deferred = Q.defer();
	/*templateModule.getInvoiceAttachmentTemplate().then(function(invoiceAttachmentTemplateID){
		return templateModule.compile(invoiceAttachmentTemplateID,mObject.invoiceID);
	})*/
	templateModule.compile("Invoice Attachment", mObject.invoiceID).then(function(compiledHTML){
		var options = {format:'A4'};
		pdf.create(compiledHTML, options).toFile('./uploads/invoice'+mObject.invoiceID+'.pdf', function(err, res) {
			if (err){
				console.log("Can't create PDF", err);
				deferred.reject(err);
			} else {
				deferred.resolve(mObject);
			}
		});
	}).fail(deferred.reject);


	return deferred.promise;
}

function sendInvoiceMail(mObject){
	//console.log("We are here too");
	var deferred = Q.defer();
	//console.log("Tools:", tools);
	tools.mailer.sendMail(mObject.subject, mObject.content, mObject.from, mObject.to, null, null, [{filename:'Invoice'+mObject.invoiceID+'.pdf', path:'./uploads/invoice'+mObject.invoiceID+'.pdf'}]);
	deferred.resolve(mObject);
	return deferred.promise;
}