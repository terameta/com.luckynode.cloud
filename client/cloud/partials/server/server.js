angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.server',{
            url: "/server",
            views: {
            	'content@r': 	{ templateUrl: "/cloud/partials/server/server.html", controller: 'ctrlServer' }
			},
            data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcServer', ['$resource',
	function srvcEndUser($resource) {
		var service = {};

		service.resource = $resource( '/api/client/server/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlServer', ['$scope', '$http', '$rootScope', '$state', '$stateParams', 'srvcEndUser',
	function($scope, $http, $rootScope, $state, $stateParams, srvcEndUser) {
		var lnToastr = toastr;

	}
]);