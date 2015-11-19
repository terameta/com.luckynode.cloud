angular.module('cloudServices').service('srvcDataCenter', ['$resource', '$rootScope',
	function srvcEndUser($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/client/datacenter/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchDataCenters = function(){
			$rootScope.dataCenters = service.resource.query(function(result){
				console.log(result);
			});
		};

		service.fetchDataCenters();

		return service;
	}
]);