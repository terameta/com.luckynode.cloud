var homeApp 			= angular.module('homeApp', ['ui.router', 'homeControllers', 'homeServices', 'ui.bootstrap', 'angular-loading-bar', 'treeControl']);
var homeServices 		= angular.module('homeServices', ['ngResource']);
var homeControllers 	= angular.module('homeControllers', []);


homeApp.config(['$locationProvider', function($locationProvider){
	$locationProvider.html5Mode(true);
}]);


homeApp.run(['$rootScope', '$state', function($rootScope, $state) {
	$rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
		$rootScope.pageTitle = 'epmvirtual - cloud servers for EPM professionals';
		$rootScope.pageDescription = 'Create a Oracle Hyperion cloud server, with full administrator access, in 15 minutes. Pricing starts at $50/mo with all the installation ready for your use.';
		$rootScope.pageKeywords = 'Hyperion Server, Hyperion Planning, Hyperion Planning Server, Essbase, Essbase Server, FDMEE, FDMEE Server, HFM, HFM Server, Oracle Hyperion Cloud Server, Hyperion Cloud Server, Oracle Hyperion Virtual Server, Hyperion Virtual Server';
	});
}]);

angular.module('homeServices').service('srvcInformation', ['$resource', '$rootScope', '$http', '$q', '$sce',
	function serverService($resource, $rootScope, $http, $q, $sce) {
		var service = {};

		service.getInformation = function(){
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: '/api/guest/settings'
			}).then(function successCallback(response) {
				deferred.resolve();
				$rootScope.accountingemail 	= response.data.accountingemail;
				$rootScope.adminemail			= response.data.adminemail;
				$rootScope.companyname			= response.data.companyname;
				$rootScope.domain					= response.data.domain;
				$rootScope.logourl				= response.data.logourl;
				$rootScope.supportemail			= response.data.supportemail;
				$rootScope.salesemail			= response.data.salesemail;
				$rootScope.phones					= response.data.phones;
			}, function errorCallback(response) {
				deferred.reject();
			});
			return deferred.promise;
		};

		return service;
	}
]);


/*
//Angular Interceptor is here
cloudApp.config(function($httpProvider) {
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

				return deferred.promise;* /
			}
		};
	});

});

cloudApp.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider){
    cfpLoadingBarProvider.includeSpinner = false;
}]);

cloudApp.run(['$rootScope', '$state', '$signinModal', '$localStorage', function($rootScope, $state, $signinModal, $localStorage) {
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

*/