angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('welcome',{
            url: "/welcome",
            templateUrl: "/cloud/partials/welcome/welcome.html",
            controller: "welcomeController",
            data: { requireSignin: false }
		});
});

angular.module('cloudControllers').controller('welcomeController', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$userService', 'srvcSettings',
	function($scope, $http, $rootScope, $state, $stateParams, $userService, srvcSettings) {
		srvcSettings.getLogo().then(function(result){
			$rootScope.logoURL = result.logourl;
			$rootScope.domain = result.domain;
		});

		$userService.getCurUser();
		if($rootScope.curUser){
			console.log($rootScope.curUser);
			$state.go('r.dashboard');
		}

		$scope.signinWarning = '';

		$scope.signin = function(){
			if(!$scope.cfcResponse){
				$scope.signinWarning = 'Please verify recaptcha';
				return false;
			}
			$userService.signin($scope.email, $scope.pass, $scope.lostverification).then(
				function/*success*/(){
					$state.go("r.dashboard");
				},
				function/*failed*/(){
					$scope.signinWarning = 'Invalid credentials, please try again';
				}
			);
		};
	}
]);