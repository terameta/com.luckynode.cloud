angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
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

angular.module('adminServices').service('srvcUsers', ['$resource', '$rootScope',
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


angular.module('adminControllers').controller('userController', ['$scope', '$rootScope', 'srvcUsers', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage',
	function($scope, $rootScope, srvcUsers, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage){
		var lnToastr = toastr;

		srvcUsers.fetchAll();

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

		$scope.refreshUsers = function(){
			srvcUsers.fetchAll();
		};

		$scope.deleteUser = function(curID){
			$rootScope.users.forEach(function(curDelUser){
				if(curDelUser._id == curID) $scope.curUser = curDelUser;
			});
			if(confirm("Are you sure you want to delete " + $scope.curUser.email)){
				$scope.curUser.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the user");
						$state.go($state.current, {}, {reload: true});
					} else {
						lnToastr.info("User is deleted");
						$state.go('r.dashboard.users');
						srvcUsers.fetchAll();
					}
				}, function(issue){
					lnToastr.error("User is not deleted, please send an email message to admin");
					srvcUsers.fetchAll();
				});
			}
		};
	}
]);