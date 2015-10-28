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

angular.module('cloudControllers').controller('ctrlProfile', ['$scope', '$http', '$rootScope', '$state', '$stateParams', 'srvcEndUser', 'Upload',
	function($scope, $http, $rootScope, $state, $stateParams, srvcEndUser, Upload) {
		var lnToastr = toastr;

		$scope.pd = function(e){e.preventDefault();};

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

		$scope.fetchCurEndUser = function(){
			$scope.curEndUser = srvcEndUser.get({id: $scope.curUser.id}, function(result){
				if($scope.curEndUser.haspicture){
					$rootScope.ppicurl = '/api/enduser/getprofilepicture/'+$scope.curUser.id;
				}
			});
		};

		$scope.fetchCurEndUser();

		$scope.formatAddress = function(){
			if($scope.curEndUser.address)	return $scope.curEndUser.address.replace(/\n/g, "<br />");
			return false;
		};
	}
]);