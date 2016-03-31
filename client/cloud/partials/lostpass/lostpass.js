angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('lostpass',{
            url: "/lostpass",
            templateUrl: "/cloud/partials/lostpass/lostpass.html",
            controller: "lostpassController",
            data: { requireSignin: false }
		});
});

angular.module('cloudControllers').controller('lostpassController', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$userService', 'srvcSettings',
	function($scope, $http, $rootScope, $state, $stateParams, $userService, srvcSettings) {
		var lnToastr = toastr;
		$scope.forgotPasswordWarning = '';
		srvcSettings.getLogo().then(function(result){
			$rootScope.logoURL = result.logourl;
			$rootScope.domain = result.domain;
		});

		$scope.requestPassword = function(){
			if(!$scope.email) {
				$scope.forgotPasswordWarning = "Please provide a valid e-mail address";
				return false;
			}
			if(!$scope.cfcResponse){
				$scope.forgotPasswordWarning = 'Please verify recaptcha';
				return false;
			}
			$scope.forgotPasswordWarning = '';

			$userService.sendLostPassCode($scope.email).then(function slpcSucceeded(result){
				lnToastr.info("We sent you an e-mail message with your new password. Please use this new password to login.");
				$state.go("welcome");
			}, function slpcFailed(issue){
				lnToastr.error("There is an issue, please try again.");
			});
		};
	}
]);