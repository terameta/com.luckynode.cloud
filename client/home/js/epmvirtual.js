var homeApp 			= angular.module('homeApp', ['ui.router', 'homeControllers', 'homeServices', 'ui.bootstrap', 'angular-loading-bar', 'treeControl', 'vcRecaptcha']);
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

angular.module('homeServices').service('srvcLocalStorage', ['$window', function($window){
	var localStorageService = {};
	localStorageService.set = set;
	localStorageService.get = get;
	localStorageService.setObject = setObject;
	localStorageService.getObject = getObject;
	localStorageService.remove = remove;
	function set(key, value) { 			$window.localStorage[key] = value; 								}
	function get(key, defaultValue) { 	return $window.localStorage[key] || defaultValue; 			}
	function setObject(key, value) { 	$window.localStorage[key] = JSON.stringify(value); 		}
	function getObject(key) { 				return JSON.parse($window.localStorage[key] || '{}'); 	}
	function remove(key) { 					$window.localStorage.removeItem(key); return 1; 			}

	return localStorageService;
}]);











/*function localStorage($window) {



});
*/