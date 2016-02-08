var db;
var Q						= require('q');
var handlebars 		= require('handlebars');
var mongojs				= require('mongojs');
var moment				= require('moment');

module.exports = function(refdb){
	db = refdb;
	var module = {
		compile									: compile,
		/*getBoundDocument						: getBoundDocument,
		getInvoiceAttachmentTemplate		: getInvoiceAttachmentTemplate
		*/
		getNextID				: getNextID,
		create					: create
	};
	return module;
};

function getNextID(tokenObject){
	if(!tokenObject) tokenObject = {};
	var deferred = Q.defer();
	db.counters.findAndModify({ query: { _id: 'tutorialnumber' }, update: { $inc: { seq: 1 } }, new: true }, function(err, result){
		if(err){
			deferred.reject(err);
		} else {
			tokenObject._id = result.seq;
			deferred.resolve(tokenObject);
		}
	});
	return deferred.promise;
}

function create(tokenObject){
	var deferred = Q.defer();
	if(!tokenObject){
		deferred.reject("We need an object for tutorial");
	} else if(!tokenObject._id){
		deferred.reject("We need _id to be defined for the tutorial");
	} else {
		db.library.insert(tokenObject, function(err, result){
			if(err){
				deferred.reject(err);
			} else {
				console.log("ToInsert:", tokenObject);
				console.log("Inserted:", result);
				deferred.resolve(tokenObject);
			}
		});
	}
	return deferred.promise;
}
/*
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
*/

function compile(id){
	var deferred = Q.defer();
	db.library.findOne({_id:parseInt(id, 10)}, function(err, src) {
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(src.content);
		}
	});
	return deferred.promise;
}