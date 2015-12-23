var db;
var Q						= require('q');
var handlebars 		= require('handlebars');
var mongojs				= require('mongojs');
var moment				= require('moment');

module.exports = function(refdb){
	db = refdb;
	var module = {
		compile									: compile,
		getBoundDocument						: getBoundDocument,
		getInvoiceAttachmentTemplate		: getInvoiceAttachmentTemplate
	};
	return module;
};

function getInvoiceAttachmentTemplate(){
	var deferred = Q.defer();
	db.mailtemplates.findOne({name:"Invoice Attachment"}, function(err, template) {
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(template._id);
		}
	});
	return deferred.promise;
}

function getBoundDocument(id){
	var deferred = Q.defer();
	db.mailtemplates.findOne({_id:mongojs.ObjectId(id)}, function(err, data){
		if(err){
			deferred.reject(err);
		} else {
			var querier = {};
			if(data.collection == "invoices"){
				querier._id = parseInt(data.document,10);
			} else {
				querier._id = mongojs.ObjectId(data.document);
			}
			db[data.collection].findOne(querier, function(err, theDoc){
				if(err){
					deferred.reject(err);
				} else {
					db.settings.findOne(function(err, settings) {
						if(err){
							deferred.reject(err);
						} else {
							theDoc.settings = settings;
							deferred.resolve(theDoc);
						}
					});
				}
			});
		}
	});
	return deferred.promise;
}

function compile(id, docid){
	var deferred = Q.defer();
	db.mailtemplates.findOne({_id:mongojs.ObjectId(id)}, function(err, src) {
		if(err){
			deferred.reject(err);
		} else {
			var querier = {};
			var curDoc = docid;
			if(!curDoc) curDoc = src.document;
			if(src.collection == "invoices"){
				querier._id = parseInt(curDoc,10);
			} else {
				querier._id = mongojs.ObjectId(curDoc);
			}
			db[src.collection].findOne(querier, function(err, theDoc){
				if(err){
					deferred.reject(err);
				} else {
					db.settings.findOne(function(err,settings){
						if(err){
							deferred.reject(err);
						} else {
							var source = src.content;
							var template = handlebars.compile(source);

							handlebars.registerHelper("formatDate", function(item, format) {
								return moment(item).format(format).toString();
							});

							handlebars.registerHelper("formatCurrency", function(item) {
								return '$'+parseFloat(item).toFixed(2).toString();
							});

							theDoc.settings = settings;
							var result = template(theDoc);
							deferred.resolve(result);
						}
					});
				}
			});
		}
	});
	return deferred.promise;
}