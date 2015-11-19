var cloudControllers = angular.module('cloudControllers', []);

cloudControllers.controller('datacenterController', ['$scope', '$http', '$userService', '$rootScope', '$datacenter', '$state', '$stateParams', '$localStorage',
	function($scope, $http, $userService, $rootScope, $datacenter, $state, $stateParams, $localStorage) {
		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchCurDC = function(){
			$scope.curDC = $datacenter.get({id:$stateParams.id}, function(result){
				//here both result and $scope.curDC are the same things.
			});
		};

		if($stateParams.id){
			$scope.fetchCurDC();
		}
		$scope.fetchDCs();


		$scope.saveDC = function(){
			//console.log("Token", $rootScope.apiToken, $localStorage.get('apiToken'));
			$scope.curDC.$update(function(result){
				//console.log(result);
				$rootScope.dataCenters = $datacenter.query();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deleteDC = function(){
			if(confirm("Are you sure you want to delete " + $scope.curDC.name)){
				$scope.curDC.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the data center");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard');
						$scope.fetchDCs();
					}
				});
			}
		};



		$scope.addDC = function(_dcname, _dclocation){
			if(!_dcname){
				$scope.datacenternewalert = "Name can't be empty";
				return 0;
			}
			if(!_dclocation){
				$scope.datacenternewalert = "Location can't be empty";
				return 0;
			}
			$scope.datacenternewalert = '';
			var theNewDC = new $datacenter;
			theNewDC.name = _dcname;
			theNewDC.location = _dclocation;
			$datacenter.save(theNewDC, function(theResult){
				$scope.fetchDCs();
				//For now we are going to dashboard itself. In the future, we should go to details of the datacenter
				$state.go('r.dashboard.datacenters');
			});
		};

		$scope.addDCcancel = function(){
			$state.go('r.dashboard');
		};
	}
]);

cloudControllers.controller('dashboardController', ['$scope', '$http', '$userService', '$rootScope', '$datacenter', '$state',
	function($scope, $http, $userService, $rootScope, $datacenter, $state) {
		$scope.managersGo = function(){
			$state.go("r.dashboard.managers");
		};

		$scope.datacentersGo = function(){
			$state.go("r.dashboard.datacenters");
		};

		$scope.nodesGo = function(){
			$state.go("r.dashboard.nodes");
		};

		$scope.plansGo = function(){
			$state.go("r.dashboard.plans");
		};

		$scope.serversGo = function(){
			$state.go("r.dashboard.servers");
		};

		$scope.imagesGo = function(){
			$state.go("r.dashboard.images");
		};

		$scope.isofilesGo = function(){
			$state.go("r.dashboard.isofiles");
		};

		$scope.ipblocksGo = function(){
			$state.go("r.dashboard.ipblocks");
		};

		$scope.storagesGo = function(){
			$state.go("r.dashboard.storages");
		};

		$scope.logsGo = function(){
			$state.go("r.dashboard.logs");
		};

		$scope.isCurFocus = function(toCheck){
			if($state.current.name.indexOf('.'+toCheck) >= 0){
				if(toCheck == 'dashboard'){
					if($state.current.name == 'r.dashboard'){
						return true;
					} else {
						return false;
					}
				} else {
					return true;
				}
			} else {
				return false;
			}
		};
/*
		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchDCs();
*/
		$.AdminLTE.layout.activate();
		$.AdminLTE.layout.fix();
		$.AdminLTE.layout.fixSidebar();
		$.AdminLTE.pushMenu.activate("[data-toggle='offcanvas']");

	}


]);

cloudControllers.controller('profileController', ['$scope', '$routeParams', function($scope, $routeParams) {
	console.log("profileController");
}]);

cloudControllers.controller('welcomeController', function($scope, $modal, $state, $http, $q, $userService) {

	$scope.openSignUpModal = function() {
		var instance = $modal.open({
			templateUrl: 'partials/authentication/signupModal.html',
			controller: 'signupModalController',
			controllerAs: 'signupModalController'
		});

		instance.result.then(
			function(result) {
				console.log("Result", result);
			},
			function(result) {
				console.log("Dismissed:", result);
			}
		);
	};

	$scope.openSignInModal = function(){
		$state.go('dashboard');
	};
});

cloudControllers.controller('signupModalController', function($scope, $userService) {
	this.cancel = $scope.$dismiss;
	this.submit = function(email, password) {
		console.log("Register", email, password);
		$scope.$close(1);
	};
});


cloudControllers.controller('signinModalController', function($scope, $userService) {

	this.cancel = $scope.$dismiss;
	this.submit = function(email, password) {
		$userService.signin(email, password).then(function(result) {
			$scope.$close(result);

		});
	};
});

cloudControllers.controller('signoutController', function($scope, $userService, $state) {
	$userService.signout().then(function(result) {
		$state.go('r.dashboard');
	});
});