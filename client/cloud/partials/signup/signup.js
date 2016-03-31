angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('signup',{
            url: "/signup",
            templateUrl: "/cloud/partials/signup/signup.html",
            controller: "signupController",
            data: { requireSignin: false }
		}).state('signup/postsignup', {
			url: "/verify/:id",
			templateUrl: "/cloud/partials/signup/postsignup.html",
			controller: "postsignupController",
			data: { requireSignin: false }
		}).state('signup/postsignupwithcode', {
			url: "/verify/:id/:code",
			templateUrl: "/cloud/partials/signup/postsignup.html",
			controller: "postsignupController",
			data: { requireSignin: false }
		});
});

angular.module('cloudControllers').controller('postsignupController', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$userService', 'srvcSettings',
	function($scope, $http, $rootScope, $state, $stateParams, $userService, srvcSettings) {
		var lnToastr = toastr;
		srvcSettings.getLogo().then(function(result){
			$rootScope.logoURL = result.logourl;
			$rootScope.domain = result.domain;
		});

		$scope.shouldDisable = false;

		if($stateParams.code){
			$scope.verificationcode = $stateParams.code;
		}

		$scope.resendVerificationCode = function(){
			console.log("Resending", $stateParams.id);
			$userService.resendVC($stateParams.id).then(
				function/*success*/(){
					lnToastr.info("Please check your inbox.<br />We have resent the code.");
				},
				function/*failed*/(data){
					lnToastr.error("Failed to resend the code.<br />"+data.error);
				}
			);
		};

		$scope.verifyCode = function(){
			$scope.shouldDisable = true;
			console.log("Verifying the code", $scope.verificationcode);
			$userService.verifycode($stateParams.id, $scope.verificationcode).then(
				function/*success*/(data){
					lnToastr.info("Successfully verified.");
					$scope.shouldDisable = false;
					$userService.signinwithToken(data.token).then(function/*success*/(){
						$state.go("r.dashboard");
					},function/*failure*/(){
						lnToastr.error("Failed to initiate the session");
						$state.go("r.dashboard");
					});

				},
				function/*failed*/(data){
					lnToastr.error("Failed to verify the code.<br />"+data.error);
					$scope.shouldDisable = false;
				}
			);
		};
	}
]);

angular.module('cloudControllers').controller('signupController', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$userService', 'srvcSettings',
	function($scope, $http, $rootScope, $state, $stateParams, $userService, srvcSettings) {
		var lnToastr = toastr;
		srvcSettings.getLogo().then(function(result){
			$rootScope.logoURL = result.logourl;
			$rootScope.domain = result.domain;
		});

		$userService.getCurUser();
		if($rootScope.curUser){
			$state.go('r.dashboard');
		}

		$scope.signupError = '';
		$scope.signingup = false;

		$scope.doesPassesMatch = false;
		$scope.isPassValid = false;
		$scope.shouldSignUp = false;

		$scope.showStrength = function(){
			$scope.passwordStrength = $userService.scorepass($scope.pass).strength;
			$scope.passwordStrengthClass = 'alert-'+$userService.scorepass($scope.pass).uiclass;
			$scope.isPassValid = $userService.scorepass($scope.pass).status;
			$scope.showPassMatch(true);
			$scope.checkPassState();
		};

		$scope.passwordMatch = '';

		$scope.showPassMatch = function(shouldStop){
			if($scope.pass == $scope.pass2){
				$scope.passwordMatch = "Passwords match";
				$scope.passwordMatchClass = "alert-success";
				$scope.doesPassesMatch = true;
			} else {
				$scope.passwordMatch = "Passwords doesn't match";
				$scope.passwordMatchClass = "alert-danger";
				$scope.doesPassesMatch = false;
			}
			if(!shouldStop) $scope.showStrength();
			$scope.checkPassState();
		};

		$scope.checkPassState = function(){
			if(!$scope.email){
				$scope.signupError = "Please enter a valid e-mail address";
				$scope.shouldSignUp = false;
				return false;
			} else {
				$scope.signupError = "";
			}
			if($scope.doesPassesMatch && $scope.isPassValid && $scope.email){
				$scope.shouldSignUp = true;
			} else {
				$scope.signupError = "Please enter a valid password";
				$scope.shouldSignUp = false;
			}
		};

		$scope.signup = function(){
			$scope.checkPassState();
			if(!$scope.shouldSignUp) return false;
			if(!$scope.cfcResponse){
				$scope.signupError = 'Please verify recaptcha';
				return false;
			}
			$scope.passwordStrengthClass = '';
			$scope.passwordMatchClass = '';
			$scope.passwordMatch = '';
			$scope.signinWarning = '';
			$scope.signupError = '';

			$userService.signup($scope.email, $scope.pass).then(
				function/*success*/(result){
					$state.go('signup/postsignup', { id: result });
				},
				function/*failed*/(issue){
					lnToastr.error(issue);
					$scope.signupError = issue.error;
				}
			);
		};
	}
]);