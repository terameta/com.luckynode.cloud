var db;
var handlebars		= require('handlebars');
var nodemailer 		= require('nodemailer');
var smtpTransport 	= require('nodemailer-smtp-transport');
var transporter;

module.exports = function mailerModule(refdb){
	db = refdb;
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
	});
}

function sendMail(subject, content, from, to, cc, bcc, attachments){
	var curVals = {};
	curVals.subject 	= subject || 'No Subject';
	curVals.text 		= content || 'No Content';
	curVals.html 		= content || 'No Content';
	curVals.from		= from || 'admin@luckynode.com';
	curVals.to 			= to;
	console.log(curVals);
	if(!curVals.to) return false;
	if(cc) curVals.cc 	= cc;
	if(bcc) curVals.bcc = bcc;
	if(attachments) curVals.attachments = attachments;
	transporter.sendMail(curVals, function(err, info){
		if(err){
			console.log("Send mail failed", err);
			return false;
		} else {
			console.log(info);
			return true;
		}
	});
}

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