angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.logs', {
			url:"/logs",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/logs/logList.html", controller: 'logController' }
			},
			data: { requireSignin: true }
		})/*.state('r.dashboard.servernew', {
			url:"/servernew",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/server/serverNew.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.server', {
			url:"/server/:id",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/server/serverDetail.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		})*/;
});

angular.module('cloudServices').service('$logs', ['$resource',
	function logService($resource) {
		return ( $resource(
			'/api/log/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('logController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', '$ipblock', '$node', '$image', '$modal', '$http', '$q',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, $ipblock, $node, $image, $modal, $http, $q){
		var lnToastr = toastr;

		lnToastr.info("We are at the logging mechanism");

	}
]);