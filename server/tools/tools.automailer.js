var db;
var handlebars		= require('handlebars');
var mongojs 		= require('mongojs');
var Q				= require('q');
var nodemailer 		= require('nodemailer');
var smtpTransport 	= require('nodemailer-smtp-transport');