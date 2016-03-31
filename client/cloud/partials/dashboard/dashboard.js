angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard',{
            url: "/dashboard",
            views: {
			//	'': 			{ templateUrl: "/cloud/partials/dashboard/dashboard.html", controller: 'dashboardController' },
			//	'mainMenu@dashboard': 	{ templateUrl: "/cloud/partials/dashboard/dashboardMenu.html" },
			//	'sidebar@dashboard': { templateUrl: "/cloud/partials/dashboard/dashboardSideBar.html" },
				'content@r': { templateUrl: "/cloud/partials/dashboard/dashboard.html", controller: 'dashboardController' }
			},
            data: { requireSignin: true }
		});
});
/*
angular.module('cloudServices').service('$manager', ['$resource',
	function managerService($resource){
		return( $resource(
			'/api/manager/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);
*/

angular.module('cloudControllers').controller('dashboardController', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$userService', 'srvcEndUser', 'srvcServer', 'srvcInvoice',
	function($scope, $http, $rootScope, $state, $stateParams, $userService, srvcEndUser, srvcServer, srvcInvoice) {
		var lnToastr = toastr;

		$scope.signout = function(){
			$userService.signout().then(function(result) {
				$state.go('welcome');
			});
		};

		$userService.getCurUser();

		$scope.memberSince = '';

		$userService.getCurUserDetails().then(function(result){
			/*console.log(result);
			console.log($rootScope.curEndUser);
			console.log($rootScope.user);
			console.log($rootScope.curUser);*/
			$scope.memberSince = moment($rootScope.curEndUser.joindate).format('DD.MMM.YYYY');
		});

		$rootScope.ppicurl = '/img/noprofileimage128.png';

		$scope.fetchCurEndUser = function(){
			$rootScope.curEndUser = srvcEndUser.get({id: $scope.curUser.id}, function(result){
				if($scope.curEndUser.haspicture){
					$rootScope.ppicurl = '/api/enduser/getprofilepicture/'+$scope.curUser.id;
				}
			});
		};
		$scope.fetchCurEndUser();

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
	}
]);