var db = {};

module.exports = function crons(refdb) {
	db = refdb;

	var cronFunctions = {
		getCollectionNames: getCollectionNames
	};

	return cronFunctions;
};

function getCollectionNames(){
	db.getCollectionNames(function(err, result){
		if(err){
			console.log("Get Collection Names Error", err);
		} else {
			console.log("List of Collections:", result);
		}
	});
}