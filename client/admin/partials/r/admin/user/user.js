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

angular.module('adminServices').service('srvcUsers', ['$resource', '$rootScope', '$http',
	function srvcUsersF($resource, $rootScope, $http) {
		var service = {};

		service.resource = $resource( '/api/users/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchAll = function(){
			$rootScope.users = service.resource.query();
		};

		service.accountBalance = function(user){
			$http.get('/api/users/balance/'+user._id).then(function /*success*/(response){
				//console.log(user);
				//console.log(response);
				user.accountBalance = response.data.accountBalance;
				user.shouldMakePayment = (user.accountBalance > 0);
				user.accountTransactions = response.data.transactions;
			}, function /*fail*/(response){
				console.log("Fail:", response);
			});
		};

		service.fetchAll();

		service.fetchOne = function(id){
			return service.resource.get({id: id});
		};

		return service;
	}
]);


angular.module('adminControllers').controller('userController', ['$scope', '$rootScope', 'srvcUsers', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage', 'srvcSettings',
	function($scope, $rootScope, srvcUsers, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage, srvcSettings){
		var lnToastr = toastr;

		srvcUsers.fetchAll();

		srvcSettings.fetchCountries();

		$scope.selectedGoToUser = '';
		$scope.gotoSelectedUser = function(){
			$state.go('r.dashboard.user', { id: $scope.selectedGoToUser });
		};

		$scope.discountTypes = [{name: '%', value: 'percentage'}, {name: '$', value: 'currency'}];

		if($stateParams.id){
			$scope.curUser = srvcUsers.fetchOne($stateParams.id);
			$scope.curUser.$promise.then(function(){
				srvcUsers.accountBalance($scope.curUser);
			});
			$scope.selectedGoToUser = $stateParams.id;
		}

		$scope.addPayEmail = function(){
			if(!$scope.curUser.payemails) $scope.curUser.payemails = [];
			$scope.curUser.payemails.push("");
		};

		$scope.deletePayEmail = function(curIndex){
			$scope.curUser.payemails.splice(curIndex,1);
			$scope.saveUser();
		};

		$scope.saveUser = function(){
			console.log("Saving user");
			console.log($scope.curUser);
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

		$scope.formatCurrency = function(value){
			if(parseFloat(value) >= 0){
				return '$' + parseFloat(value).toFixed(2);
			} else {
				return '$(' + parseFloat(value).toFixed(2)*(-1) + ')';
			}
		};

		$scope.formatDate = function(value){
			return moment(value).format('Do MMMM, YYYY');
		};

		$scope.formatDateTime = function(value){
			return moment(value).format('Do MMMM, YYYY - HH:mm');
		};
	}
]);