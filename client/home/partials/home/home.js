homeApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("");

    $stateProvider.
        state('home', {
            url: "/",
            views: {
					'mainMenu':		{ templateUrl: "/home/partials/home/menu.html", controller: "mainMenuController" },
					'mainBody':		{ templateUrl: "/home/partials/home/home.html" },
				},
            data: { requireSignin: false }
        });
});

angular.module('homeControllers').controller('mainMenuController', ['$scope', 'srvcInformation', '$window', 'srvcLocalStorage', '$rootScope',
	function($scope, srvcInformation, $window, srvcLocalStorage, $rootScope) {
		var lnToastr = toastr;
		srvcInformation.getInformation();

		function parseJWT(token){
			var base64Url = token.split('.')[1];
			if(!base64Url) return false;
			var base64 = base64Url.replace('-', '+').replace('_', '/');
			return JSON.parse($window.atob(base64));
		}

		function getCurUser(){
			if(srvcLocalStorage.get('apiToken')){
				$rootScope.curUser = parseJWT(srvcLocalStorage.get('apiToken'));
			}
		}

		getCurUser();
	}
]);