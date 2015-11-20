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

angular.module('cloudServices').service('$lnusers', ['$resource',
	function serverService($resource) {
		return ( $resource(
			'/api/users/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('userController', ['$scope', '$rootScope', '$lnusers', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage',
	function($scope, $rootScope, $lnusers, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage){
		console.log("We are at user controller");

		$rootScope.lnusers = [];

		$scope.fetchlnUsers = function(){
			$rootScope.lnusers = $lnusers.query();
		};

		$scope.fetchlnUsers();

	}
]);