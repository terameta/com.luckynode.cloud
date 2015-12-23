angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('welcome',{
            url: "/welcome",
            templateUrl: "/cloud/partials/welcome/welcome.html",
            controller: "welcomeController",
            data: { requireSignin: false }
		}).state('welcome/postsignup', {
			url: "/verify/:id",
			templateUrl: "/cloud/partials/welcome/postsignup.html",
			controller: "postsignupController",
			data: { requireSignin: false }
		}).state('welcome/postsignupwithcode', {
			url: "/verify/:id/:code",
			templateUrl: "/cloud/partials/welcome/postsignup.html",
			controller: "postsignupController",
			data: { requireSignin: false }
		});
});

angular.module('cloudControllers').controller('postsignupController', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$userService',
	function($scope, $http, $rootScope, $state, $stateParams, $userService) {
		var lnToastr = toastr;

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
					$userService.signinwithToken(data).then(function/*success*/(){
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

angular.module('cloudControllers').controller('welcomeController', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$userService',
	function($scope, $http, $rootScope, $state, $stateParams, $userService) {

		$userService.getCurUser();
		if($rootScope.curUser){
			$state.go('r.dashboard');
		}

		$scope.signinWarning = '';
		$scope.signingup = false;
		$scope.buttonText = 'Sign In';
		$scope.forgottenPassword = false;

		$scope.signin = function(){
			$scope.signinWarning = '';
			if(!$scope.signingup){
				$scope.signinAction();
			} else {
				$scope.signupAction();
			}
		};

		$scope.signinAction = function(){
			$userService.signin($scope.email, $scope.pass, $scope.lostverification).then(
				function/*success*/(){
					$state.go("r.dashboard");
				},
				function/*failed*/(){
					$scope.signinWarning = 'Invalid credentials, please try again';
				}
			);
		};

		$scope.enableForgotPassword = function(){
			$scope.forgottenPassword = true;

		};

		$scope.forgotPassword = function(){
			$scope.signinWarning = '';
			console.log($scope.email);
			if(!$scope.email) {
				$scope.signinWarning = 'Please enter a valid address';
				return false;
			}
			$userService.sendLostPassCode($scope.email).then(
				function success(result){
					console.log(result);
				}, function failure(issue){
					console.log(issue);
				}
			);
		};

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
			if(!$scope.signingup) return false;
			if(!$scope.email){
				$scope.signinWarning = "Please enter a valid e-mail address";
			} else {
				$scope.signinWarning = "";
			}
			if($scope.doesPassesMatch && $scope.isPassValid && $scope.email){
				$scope.shouldSignUp = true;
			} else {
				$scope.shouldSignUp = false;
			}
		};

		$scope.signupAction = function(){
			$scope.checkPassState();
			if(!$scope.shouldSignUp) return false;
			$scope.passwordStrengthClass = '';
			$scope.passwordMatchClass = '';
			$scope.passwordMatch = '';
			$scope.signinWarning = '';
			$scope.signupError = '';

			$userService.signup($scope.email, $scope.pass).then(
				function/*success*/(result){
					$state.go('welcome/postsignup', { id: result });
				},
				function/*failed*/(issue){
					console.log(issue);
					$scope.signupError = issue.error;
				}
			);
		};

		$scope.showSignUp = function(){
			$scope.signingup = true;
			$scope.buttonText = 'Sign Up';
		};
	}
]);