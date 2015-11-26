angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.users', {
			url:"/users",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/user/userList.html", controller: 'userController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.user', {
			url:"/user/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/isofile/isofileDetail.html", controller: 'userController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcUsers', ['$resource', '$rootScope',
	function srvcUsersF($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/users/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchAll = function(){
			$rootScope.users = service.resource.query();
		};

		service.fetchAll();

		return service;
	}
]);


angular.module('cloudControllers').controller('userController', ['$scope', '$rootScope', 'srvcUsers', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage',
	function($scope, $rootScope, srvcUsers, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage){
		console.log("We are at user controller");

	}
]);