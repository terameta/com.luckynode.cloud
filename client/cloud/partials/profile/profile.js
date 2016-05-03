angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.profile',{
            url: "/profile",
            views: {
            	'content@r': 	{ templateUrl: "/cloud/partials/profile/profile.html", controller: 'ctrlProfile' }
			},
            data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcEndUser', ['$resource',
	function srvcEndUser($resource) {
		return ( $resource(
			'/api/enduser/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('ctrlProfile', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$uibModal', 'srvcEndUser', 'Upload', '$userService',
	function($scope, $http, $rootScope, $state, $stateParams, $uibModal, srvcEndUser, Upload, $userService) {
		var lnToastr = toastr;

		$scope.pd = function(e){e.preventDefault();};

		$http({
			method: 'GET',
			url: '/api/settings/countries'
		}).then(function successCallback(response) {
			$rootScope.countries = response.data;
		}, function errorCallback(response) {
			toastr.error("Countries Fetch Error:<br />" + response.data);
		});

		$scope.ppicprogress = 0;

		$scope.uploadProfilePicture = function(){
			if($scope.file){
				$scope.uploadProfilePictureAction($scope.file);
			}
		};

		$scope.uploadProfilePictureAction = function(file){
			Upload.upload({
				url: '/api/enduser/uploadprofilepicture',
				data: { file: file, id: $scope.curEndUser._id }
			}).then(function (resp) {
				console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
				$scope.fetchCurEndUser();
			}, function (resp) {
				console.log('Error status: ' + resp.status);
			}, function (evt) {
				$scope.ppicprogress = parseInt(100.0 * evt.loaded / evt.total, 10);
			});
		};

		$scope.saveMainProfile = function(){
			$scope.curEndUser.$update(function(result){
				$scope.fetchCurEndUser();
				lnToastr.info("Profile is updated");
			}, function(error){
				lnToastr.error("Error saving profile<br />"+error);
			});
		};

		$rootScope.ppicurl = '/img/noprofileimage128.png';

		$scope.memberSince = '';

		$scope.fetchCurEndUser = function(){
			$scope.curEndUser = srvcEndUser.get({id: $scope.curUser.id}, function(result){
				if($scope.curEndUser.haspicture){
					$rootScope.ppicurl = '/api/enduser/getprofilepicture/'+$scope.curUser.id;
				}
				$scope.memberSince = moment($rootScope.curEndUser.joindate).format('DD.MMM.YYYY');
			});
		};

		$scope.fetchCurEndUser();

		$scope.formatAddress = function(){
			if($scope.curEndUser.address)	return $scope.curEndUser.address.replace(/\n/g, "<br />");
			return false;
		};

		$scope.changePassword = function(){
			if(!$scope.cpDetails) $scope.cpDetails = {};
			$scope.cpModalInstance = $uibModal.open({
				animation: true,
				templateUrl: "/cloud/partials/profile/changePasswordModal.html",
				size: 'lg',
				scope: $scope
			});

			$scope.cpModalInstance.result.finally(function(){
				$scope.changePasswordChangingPassword = false;
			});
		};

		$scope.changePasswordChangingPassword = false;
		$scope.changePasswordAction = function(){
			$scope.changePasswordChangingPassword = true;
			$scope.cpActionAlert = '';
			$userService.changePassword($scope.cpDetails.curpass, $scope.cpDetails.newpass, $scope.cpDetails.newpas2).then(
				function /*success*/(result){
					lnToastr.info("Password is successfully updated.");
					$scope.cpModalInstance.dismiss();
					$scope.changePasswordChangingPassword = false;
				}, function /*error*/(issue){
					if(issue.type == 'manual'){
						$scope.cpActionAlert = issue.error;
					} else if(issue.error.message) {
						$scope.cpActionAlert = issue.error.message;
					} else {
						$scope.cpActionAlert = 'There is an error. Please try again.';
					}
					$scope.changePasswordChangingPassword = false;
				}
			);
		};

		$scope.passwordStrength = '';
		$scope.passwordStrengthClass = '';

		$scope.showStrength = function(){
			$scope.passwordStrength = $userService.scorepass($scope.cpDetails.newpass).strength;
			$scope.passwordStrengthClass = 'alert-'+$userService.scorepass($scope.cpDetails.newpass).uiclass;
			$scope.isPassValid = $userService.scorepass($scope.cpDetails.newpass).status;
		};

		$scope.changePasswordCancel = function(){
			$scope.changePasswordChangingPassword = false;
			$scope.cpModalInstance.dismiss();
		};
	}
]);