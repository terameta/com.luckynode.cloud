var db;
var handlebars			= require('handlebars');
var mongojs 			= require('mongojs');
var Q						= require('q');
var nodemailer 		= require('nodemailer');
var smtpTransport 	= require('nodemailer-smtp-transport');

module.exports = function mailerModule(refdb){
	db = refdb;
	var module = {
		theLogger: theLogger
	};
	return module;
};

function theLogger(){
	console.log("I am theLogger");
}