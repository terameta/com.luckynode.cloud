angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.server',{
            url: "/server",
            views: {
            	'content@r': 	{ templateUrl: "/cloud/partials/server/server.html", controller: 'ctrlServer' }
			},
            data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcServer', ['$resource', '$rootScope',
	function srvcEndUser($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/client/server/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchServers = function(){
			//console.log("Fetching servers");
			$rootScope.servers = service.resource.query(function(result){
				//console.log(result);
			});
		};

		service.fetchServers();

		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlServer', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$modal', 'srvcDataCenter', 'srvcServer', 'srvcPlan',
	function($scope, $http, $rootScope, $state, $stateParams, $modal, srvcDataCenter, srvcServer, srvcPlan) {
		var lnToastr = toastr;

		$scope.orderServer = function(){
			console.log("We are ordering a server");
			$scope.nbmodalInstance = $modal.open({
				animation: true,
				templateUrl: "/cloud/partials/server/serverOrderModal.html",
				size: 'lg',
				scope: $scope
			});
		};


	}
]);