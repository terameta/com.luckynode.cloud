var nodemailer 		= require('nodemailer');
var smtpTransport 	= require('nodemailer-smtp-transport');
var transporter 	= nodemailer.createTransport(
		smtpTransport(
			{
				host: 'mail.luckynode.com',
				port:465 ,
				secure:true,
				tls: {rejectUnauthorized: false},
				auth: { user: 'admin@luckynode.com', pass: 'tKQIbKPyj&qCo2RJ' }
			}
		)
	);

module.exports = {
	sendMail: sendMail
};

function sendMail(){
	console.log("We will send mail");
}
