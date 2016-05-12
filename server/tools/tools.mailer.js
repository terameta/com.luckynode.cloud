var db;
var handlebars			= require('handlebars');
var mongojs 			= require('mongojs');
var Q					= require('q');
var nodemailer 			= require('nodemailer');
var smtpTransport 		= require('nodemailer-smtp-transport');
var sparkPostTransport 	= require('nodemailer-sparkpost-transport');
var transporter;
var templateModule;

module.exports = function mailerModule(refdb){
	db = refdb;
	templateModule = require('../modules/module.template.js')(db);
	defineTransporter();
	var module = {
		sendMail: sendMail,
		sendTemplateMail: sendTemplateMail
	};
	return module;
};

function defineTransporter(){
	db.settings.findOne(function(err, result){
		if(err){
			console.log("error getting settings at defineTransporter");
		} else {
			console.log(result.sparkpost);
			if(result.mailtransporter == "sparkpost"){
				transporter = nodemailer.createTransport(sparkPostTransport({
					sparkPostApiKey: result.sparkpost.pass,
					options: {
						open_tracking: true,
						click_trackin: true,
						transactional: true
					}
				}));
			} else {
				transporter = nodemailer.createTransport(
					smtpTransport({
						host	: result.mailserver.host,
						port	: result.mailserver.port,
						secure	: (result.mailserver.isSecure == 'true'),
						tls		: {
							rejectUnauthorized: (result.mailserver.rejectUnauthorized == 'true')
						},
						auth	: {
							user: result.mailserver.user,
							pass: result.mailserver.pass
						}
					})
				);
			}
		}
	});
}

function sendMail(subject, content, from, to, cc, bcc, attachments, replyTo){
	var deferred = Q.defer();
	var curVals = {};
	curVals.subject 	= subject || 'No Subject';
	curVals.text 		= content || 'No Content';
	curVals.html 		= content || 'No Content';
	curVals.from		= from || 'admin@luckynode.com';
	curVals.to 			= to;
	//console.log(curVals);
	if(!curVals.to) return false;
	if(cc) curVals.cc 	= cc;
	if(bcc) curVals.bcc = bcc;
	if(attachments) curVals.attachments = attachments;
	if(replyTo) curVals.replyTo		= replyTo;
	transporter.sendMail(curVals, function(err, info){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(info);
		}
	});
	return deferred.promise;
}

function sendTemplateMail(templateName, docID, subject, from, to, cc, bcc, attachments, replyTo){
	var deferred = Q.defer();
	templateModule.compile(templateName, docID).
	then(function(mailHTML){
		return sendMail(subject, mailHTML, from, to, cc, bcc, attachments, replyTo);
	}).
	then(deferred.resolve).
	fail(deferred.reject);
	return deferred.promise;
}
/*
function sendTemplateMail(templateName, to, data){
	var template = handlebars.compile(welcomeMailTemplate);
	var mailHTML = template(data);
	sendMail("ABC", mailHTML, "admin@luckynode.com", "aliriza.dikici@gmail.com");
}

var welcomeMailTemplate = "\
	<img src=\"https://cloud.luckynode.com/img/logodashboardfull.png\"><br /> \
	This is the welcomeMailTemplate<br /> \
	Your code is {{code}} <br />\
	<a href=\"https://luckynode.com/cloud/#/verify/{{userid}}/{{code}}\">Click here to validate</a>\
";
*/