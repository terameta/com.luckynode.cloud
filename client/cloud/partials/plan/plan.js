angular.module('cloudServices').service('srvcPlan', ['$resource', '$rootScope',
	function srvcPlanF($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/client/plan/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchPlans = function(){
			$rootScope.plans = service.resource.query(function(result){
				console.log("Plans fetched");
			});
		};

		service.fetchPlans();

		return service;
	}
]);