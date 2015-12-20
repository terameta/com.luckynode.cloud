var db;
var Q					= require('q');
var mongojs 		= require('mongojs');
var moment			= require('moment');
var pdf 				= require('html-pdf');
var tools			= require("../tools/tools.main.js");

module.exports = function(refdb){
	db = refdb;
	var module = {
		startProcess: startProcess,
	};
	return module;
};

function startProcess(){
	assignDate().
	then(processAll).
	then(processAllMail).
	then(function(result){
		console.log("Invoice process completed:", result);
	});
}

function assignDate(){
	var deferred = Q.defer();
	db.servers.find( { nextinvoicedate: { $exists: false } }, { createdat:1}, function(err, result) {
		if(err){
			deferred.reject(err);
		} else if(result.length == 0) {
			deferred.resolve("All OK");
		} else {
			db.servers.update({_id:result[0]._id, nextinvoicedate: { $exists: false }, invoicestat: {$exists: false} }, { $set:{nextinvoicedate:result[0].createdat, invoicestat:'OK'} }, function(uerr, uresult){
				if(uerr){
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
	var deferred = Q.defer();
	db.servers.find({nextinvoicedate: {$lt: new Date()}, invoicestat: 'OK'},{_id:1}, function(err, result){
		if(err){
			deferred.reject(err);
		} else if(result.length == 0) {
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
	then(sendInvoice).
	then(deferred.resolve).
	fail(function(issue){
		console.log("Failed", issue);
		deferred.reject(issue);
	});
	return deferred.promise;
}

function findPrice(tokenObject){
	var deferred = Q.defer();
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
			tokenObject.discountDescription = tokenObject.discountDescription.trim();
			//console.log(tokenObject.discount, tokenObject.discountDescription);
			deferred.resolve(tokenObject);
		}
	});
	return deferred.promise;
}

function findPayTo(tokenObject){
	var deferred = Q.defer();
	tokenObject.payTo = tokenObject.user.payto.toString().trim();
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
	var html  = "<html>";
	html 		+= "	<body style=\"padding:0;margin:0;\">";
	html		+= "		<div style=\"display:block;height:30px\">&nbsp;</div>";
	html 		+= "		<div style=\"display:block;height:100px;background-color:"+mObject.settings.emailletterheadcolor+"\">";
	html		+= "			<table width=\"100%\" height=\"100%\"  style=\"background:transparent\">";
	html 		+= "				<tr>";
	html 		+= "					<td width=\"200px\" style=\"padding:10px;\" valign=\"middle\" align=\"left\">";
	html 		+= "						<img src=\""+mObject.settings.emailletterheadlogourl+"\">";
	html 		+= "					<td>";
	html 		+= "					<td style=\"padding:10px;\" valign=\"middle\" align=\"center\">";
	html 		+= "						<span style=\"color:white;font-size:30px;\">INVOICE</span>";
	html 		+= "					<td>";
	html 		+= "					<td width=\"200px\" style=\"padding:10px;\" valign=\"middle\" align=\"right\">";
	html 		+= "						<span style=\"color:white;\">"+mObject.settings.accountingemail+"</span>";
	html 		+= "					<td>";
	html 		+= "				<tr>";
	html 		+= "			</table>";
	html 		+= "		</div>";
	html 		+= "	</body>";
	html 		+= "</html>";
	var options = {format:'A4'};
	pdf.create(html, options).toFile('./uploads/invoive'+mObject.invoiceID+'.pdf', function(err, res) {
		if (err){
			console.log("Can't create PDF", err);
			deferred.reject(err);
		} else {
			deferred.resolve(mObject);
		}
	});
	return deferred.promise;
}

function sendInvoiceMail(mObject){
	console.log("We are here too");
	var deferred = Q.defer();
	tools.mailer.sendMail(mObject.subject, mObject.content, mObject.from, mObject.to, null, null, [{filename:'Invoive'+mObject.invoiceID+'.pdf', path:'./uploads/invoive'+mObject.invoiceID+'.pdf'}]);
	deferred.resolve(mObject);
	return deferred.promise;
}