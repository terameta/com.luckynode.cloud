var cloudControllers = angular.module('cloudControllers', []);

cloudControllers.controller('dashboardController', ['$scope', '$http', '$userService', '$rootScope', '$datacenter', '$state',
	function($scope, $http, $userService, $rootScope, $datacenter, $state) {
/*		$scope.managersGo = function(){
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
*/
		$scope.isCurFocus = function(toCheck){
			if($state.current.name.indexOf('.'+toCheck) >= 0){
				if(toCheck == 'dashboard'){
					return ($state.current.name == 'r.dashboard');
				} else if(toCheck == 'image'){
					return ($state.current.name.toString().substr(0,22) != 'r.dashboard.imagegroup');
				} else {
					return true;
				}
			} else {
				return false;
			}
		};
		activateLayout();
		setTimeout(activateLayout,1000);
		setTimeout(activateLayout,5000);
	}


]);

function activateLayout(){
	$.AdminLTE.layout.activate();
	$.AdminLTE.layout.fix();
	$.AdminLTE.layout.fixSidebar();
	$.AdminLTE.pushMenu.activate("[data-toggle='offcanvas']");
	//setTimeout(activateLayout,1000);
}

cloudControllers.controller('profileController', ['$scope', '$routeParams', function($scope, $routeParams) {
	console.log("profileController");
}]);

cloudControllers.controller('welcomeController', function($scope, $uibModal, $state, $http, $q, $userService) {

	$scope.openSignUpModal = function() {
		var instance = $uibModal.open({
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