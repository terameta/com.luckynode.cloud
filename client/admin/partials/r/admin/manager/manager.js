angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.managers', {
			url:"/managers",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/manager/managerList.html", controller: 'managerController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.managernew', {
			url:"/managernew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/manager/managerNew.html", controller: 'managerController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.manager', {
			url:"/manager/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/manager/managerDetail.html", controller: 'managerController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('$manager', ['$resource',
	function managerService($resource){
		return( $resource(
			'/api/manager/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('managerController', ['$scope', '$http', '$userService', '$rootScope', '$manager', '$datacenter', '$state', '$stateParams', '$localStorage',
	function($scope, $http, $userService, $rootScope, $manager, $datacenter, $state, $stateParams, $localStorage) {
		function validIP4(toCheck) {
			var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
			return (toCheck.match(ipformat));
		}

		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchManagers = function(){
			$rootScope.managers = $manager.query();
		};

		$scope.fetchCurManager = function(){
			$scope.curManager = $manager.get({id:$stateParams.id}, function(result){
				//here fetch is done.
			});
		};


		if($stateParams.id){
			$scope.fetchCurManager();
		}

		$scope.fetchDCs();
		$scope.fetchManagers();

		$scope.addManager = function(_name, _datacenter, _ipaddress, _internalip){
			if(!_name){
				$scope.managernewalert = "Name can't be empty";
				return 0;
			}
			if(!_datacenter){
				$scope.managernewalert = "Data center can't be empty";
				return 0;
			}
			if(!_ipaddress){
				$scope.managernewalert = "IP address can't be empty";
				return 0;
			}
			if(!validIP4(_ipaddress)){
				$scope.managernewalert ="IP address is not valid";
				return 0;
			}
			if(_internalip){
				if(!validIP4(_internalip)){
					$scope.managernewalert = 'Internal IP address is not valid';
					return 0;
				}
			}
			$scope.managernewalert = '';
			var theNewManager = new $manager;
			theNewManager.name = _name;
			theNewManager.datacenter = _datacenter._id;
			theNewManager.ip = _ipaddress;
			if(_internalip) theNewManager.internalip = _internalip;
			$manager.save(theNewManager, function(theResult){
				$scope.fetchManagers();
				//For now we are going to dashboard itself. In the future, we should go to details of the datacenter
				$state.go('r.dashboard.managers');
			});
		};

		$scope.addManagerCancel = function(){
			$state.go('r.dashboard.managers');
		};

		$scope.saveManager = function(){
			$scope.curManager.$update(function(result){
				$rootScope.managers = $manager.query();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deleteManager = function(){
			if(confirm("Are you sure you want to delete " + $scope.curManager.name)){
				$scope.curManager.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the manager");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard.managers');
						$scope.fetchManagers();
					}
				});
			}
		};

	}
]);