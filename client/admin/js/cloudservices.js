var cloudServices = angular.module('cloudServices', ['ngResource']);

cloudServices.service('$datacenter', ['$resource',
	function datacenterService($resource) {
		return ( $resource(
			'/api/datacenter/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

cloudServices.service('$userService', ['$resource', '$q', '$rootScope', '$localStorage', '$http',
    function userService($resource, $q, $rootScope, $localStorage, $http) {
        var service = {};

        service.signin = signin;
        service.signout = signout;

        return service;

        function signin(username, password) {
            var deferred = $q.defer();
            var signinParams = {
                email: username,
                pass: password
            };
            if(username && password) {
            	$http.post('/api/users/authenticate', signinParams).
            	success(function(data, status, headers, config) {
            		$rootScope.apiToken = data.token;
            		$localStorage.set('apiToken', data.token);
            		deferred.resolve(data);
            	}).
            	error(function(data, status, headers, config) {
            		deferred.reject(data);
            	});
            }
            else {
            	deferred.reject("No username/password");
            }
            return deferred.promise;
        }

        function signout() {
            var deferred = $q.defer();
            $rootScope.apiToken = undefined;
            $localStorage.remove('apiToken');
            deferred.resolve();
            return deferred.promise;
        }
    }
]);

cloudServices.service('$signinModal', function($modal, $rootScope, $localStorage, $timeout) {

    function assignCurrentUser(data) {
        $rootScope.apiToken = data.token;
        $localStorage.set('apiToken', data.token);
        return data;
    }

    return function() {
        var instance = $modal.open({
            templateUrl: '/admin/partials/authentication/signinModal.html',
            controller: 'signinModalController',
            controllerAs: 'signinModalController'
        });

        return instance.result.then(assignCurrentUser);
    };

});

cloudServices.service('$localStorage', function localStorage($window) {
    var localStorageService = {};
    localStorageService.set = set;
    localStorageService.get = get;
    localStorageService.setObject = setObject;
    localStorageService.getObject = getObject;
    localStorageService.remove = remove;

    function set(key, value) {
        $window.localStorage[key] = value;
    }

    function get(key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
    }

    function setObject(key, value) {
        $window.localStorage[key] = JSON.stringify(value);
    }

    function getObject(key) {
        return JSON.parse($window.localStorage[key] || '{}');
    }

    function remove(key) {
        $window.localStorage.removeItem(key);
        return 1;
    }

    return localStorageService;
});
