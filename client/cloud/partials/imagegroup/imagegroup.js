angular.module('cloudServices').service('srvcImageGroup', ['$resource', '$rootScope',
	function srvcImageGroupF($resource, $rootScope) {
		var service = {};
		service.resource = ( $resource(
			'/api/client/imagegroup/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );

		service.fetchAll = function(){
			$rootScope.imagegroups = service.resource.query();
		};

		service.fetchAll();

		service.fetchOne = function(id){
			return service.resource.get({id: id});
		};

		service.getTypes = function(){
			return [{name:"Hidden", value: "hidden"},{name:"Public", value: "public"}];
		};

		return service;
	}
]);