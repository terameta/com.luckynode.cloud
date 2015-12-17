angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.users', {
			url:"/users",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/user/userList.html", controller: 'userController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.user', {
			url:"/user/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/user/userDetail.html", controller: 'userController' }
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

		service.fetchOne = function(id){
			return service.resource.get({id: id});
		};

		return service;
	}
]);


angular.module('cloudControllers').controller('userController', ['$scope', '$rootScope', 'srvcUsers', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage',
	function($scope, $rootScope, srvcUsers, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage){
		var lnToastr = toastr;

		$scope.discountTypes = [{name: '%', value: 'percentage'}, {name: '$', value: 'currency'}];

		if($stateParams.id){
			$scope.curUser = srvcUsers.fetchOne($stateParams.id);
		}

		$scope.saveUser = function(){
			$scope.curUser.$update(function(result){
				lnToastr.success("User is saved");
			}, function(error){
				lnToastr.error("User save failed<br>"+error);
			});
		};
	}
]);