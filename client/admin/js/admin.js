var adminApp = angular.module('adminApp', ['ui.router', 'adminControllers', 'adminServices', 'ngSanitize', 'ui.bootstrap', 'angular-loading-bar', 'xeditable', 'checklist-model', 'ui.ace']);

adminApp.config(['$locationProvider', function($locationProvider){
	$locationProvider.html5Mode(true);
}]);


adminApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("r/welcome");

    $stateProvider.
        state('r', {                                                           //r for root
            url: "/r",
            templateUrl: "/admin/partials/r/r.html",
            data: { requireSignin: false }
        }).state('r.welcome',{
            url: "/welcome",
            views: {
            	'mainBody': { controller: 'welcomeController'}
            },
            data: { requireSignin: false }
		}).state('r.dashboard', {
			url:"/dashboard",
			views: {
				'': 			{ templateUrl: "/admin/partials/r/admin/dashboard.html" },
				'mainMenu': 	{ templateUrl: "/admin/partials/r/admin/dashboardMenu.html" },
				'mainBody':		{ templateUrl: "/admin/partials/r/admin/dashboardBody.html", controller: 'dashboardController' },
				'sidebar@r.dashboard': { templateUrl: "/admin/partials/r/admin/dashboardSideBar.html" },
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/dashboardContent.html" }
			},
			data: { requireSignin: true }
		}).state('r.signout', {
			url: "/signout",
			views: {
				'': 			{ templateUrl: "/admin/partials/r/guest/welcome.html"},
				'mainMenu':		{ templateUrl: "/admin/partials/r/admin/dashboardMenu.html" },
				'mainBody':		{ templateurl: "/admin/partials/r/admin/dashboardBody.html", controller: 'signoutController'  }
			},
			data: { requireSignin: false }
		});
});

//Angular Interceptor is here
adminApp.config(function($httpProvider) {
	$httpProvider.interceptors.push(function($timeout, $q, $injector, $rootScope, $localStorage) {
		var $signinModal, $http, $state;


		// this trick must be done so that we don't receive
		// `Uncaught Error: [$injector:cdep] Circular dependency found`
		$timeout(function() {
			$signinModal = $injector.get('$signinModal');
			$http = $injector.get('$http');
			$state = $injector.get('$state');
		});

		return {
			request: function(config){
				config.headers['x-access-token'] = $localStorage.get('apiToken');
				return config;
			},
			responseError: function(rejection) {
				var deferred = $q.defer();

				if (rejection.status !== 401) {
					deferred.reject(rejection);
				} else {
					$signinModal()
						.then(function() {
							deferred.resolve($http(rejection.config));
						})
						.catch(function() {
							$state.go('r.welcome');
							deferred.reject(rejection);
						});
				}
				return deferred.promise;
				/* old version
				if (rejection.status !== 401) {
					return rejection;
				}

				var deferred = $q.defer();

				$signinModal()
					.then(function() {
						deferred.resolve($http(rejection.config));
					})
					.catch(function() {
						$state.go('r.welcome');
						deferred.reject(rejection);
					});

				return deferred.promise;*/
			}
		};
	});

});

adminApp.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider){
    cfpLoadingBarProvider.includeSpinner = false;
}]);

adminApp.run(['$rootScope', '$state', '$signinModal', '$localStorage', function($rootScope, $state, $signinModal, $localStorage) {
	$rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
		var requireSignin = toState.data.requireSignin;
		$rootScope.apiToken = $localStorage.get('apiToken');

		if (requireSignin && typeof $rootScope.apiToken === 'undefined') {
			event.preventDefault();

			$signinModal()
				.then(function() {
					return $state.go(toState.name, toParams);
				})
				.catch(function() {
					return $state.go('r.welcome');
				});
		}
	});
}]);