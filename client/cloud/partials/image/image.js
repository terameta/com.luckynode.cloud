angular.module('cloudServices').service('srvcImage', ['$resource', '$rootScope',
	function srvcPlanF($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/client/image/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchImages = function(){
			$rootScope.images = service.resource.query();
		};

		service.fetchImages();

		return service;
	}
]);