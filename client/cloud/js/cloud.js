var cloudApp 			= angular.module('cloudApp', ['ui.router', 'cloudControllers', 'cloudServices', 'ngSanitize', 'ui.bootstrap', 'angular-loading-bar', 'xeditable', 'checklist-model']);
var cloudControllers 	= angular.module('cloudControllers', []);
var cloudServices 		= angular.module('cloudServices', ['ngResource']);

cloudApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("welcome");

    $stateProvider.
        state('root', {
            url: "/r",
            templateUrl: "/cloud/partials/root.html",
            data: { requireSignin: false }
        });
});

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
				} else if($state.current.url == '/welcome'){
					console.log("We are welcome screen no need to open modal");
					deferred.reject(rejection);
				} else {
					console.log($state.current.url);
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

cloudServices.service('$signinModal', function($modal, $rootScope, $localStorage, $timeout) {

    function assignCurrentUser(data) {
        $rootScope.apiToken = data.token;
        $localStorage.set('apiToken', data.token);
        return data;
    }

    return function() {
        var instance = $modal.open({
            templateUrl: '/partials/authentication/signinModal.html',
            controller: 'signinModalController',
            controllerAs: 'signinModalController'
        });

        return instance.result.then(assignCurrentUser);
    };

});

cloudControllers.controller('signinModalController', function($scope, $userService) {

	this.cancel = $scope.$dismiss;
	this.submit = function(email, password) {
		$userService.signin(email, password).then(function(result) {
			$scope.$close(result);

		});
	};
});

cloudServices.service('$userService', ['$resource', '$q', '$rootScope', '$localStorage', '$http',
    function userService($resource, $q, $rootScope, $localStorage, $http) {
        var service = {};

        service.signin = signin;
        service.signout = signout;
        service.scorepass = scorepass;
        service.signup = signup;
        service.resendVC = resendVC;

        return service;

        function signup(username, password){
        	var deferred = $q.defer();
        	var signupParams = {
        		email: username,
        		pass: password
        	};
        	if(username && password){
        		$http.post('/api/users/signup', signupParams).
        		success(function(data, status, headers, config){
        			deferred.resolve(data);
        		}).
        		error(function(data, status, headers, config){
        			deferred.reject(data);
        		});
        	} else {
        		deferred.reject("No username/password");
        	}
        	return deferred.promise;
        }

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

        function resendVC(id){
        	var deferred = $q.defer();
        	var vcParams = {id: id};
        	$http.post('/api/users/resendvc', vcParams).
        	success(function(data, status, headers, config) {
        		deferred.resolve(data);
        	}).
        	error(function(data, status, headers, config) {
        		deferred.reject(data);
        	});
        	return deferred.promise;
        }

        function signout() {
            var deferred = $q.defer();
            $rootScope.apiToken = undefined;
            $localStorage.remove('apiToken');
            deferred.resolve();
            return deferred.promise;
        }

		function scorepass(pass) {
			var score = 0;
			if (!pass)
				return score;

			// award every unique letter until 5 repetitions
			var letters = new Object();
			for (var i = 0; i < pass.length; i++) {
				letters[pass[i]] = (letters[pass[i]] || 0) + 1;
				score += 5.0 / letters[pass[i]];
			}

			// bonus points for mixing it up
			var variations = {
				digits: /\d/.test(pass),
				lower: /[a-z]/.test(pass),
				upper: /[A-Z]/.test(pass),
				nonWords: /\W/.test(pass),
			};

			var variationCount = 0;
			for (var check in variations) {
				variationCount += (variations[check] == true) ? 1 : 0;
			}
			score += (variationCount - 1) * 10;
			score = parseInt(score, 10);
			var toReturn = { score: score, strength: 'Weak', status: false, uiclass: 'danger' };
			if(score > 30){ 		toReturn.score = score; toReturn.strength = 'Weak', 	toReturn.status= false; 	toReturn.uiclass = 'danger';	}
			if(score > 50){ 		toReturn.score = score; toReturn.strength = 'Moderate', toReturn.status= true; 		toReturn.uiclass = 'warning';	}
			if(score > 80){ 		toReturn.score = score; toReturn.strength = 'Strong', 	toReturn.status= true; 		toReturn.uiclass = 'success';	}
			if(pass.length < 8){ 	toReturn.score = score; toReturn.strength = 'Weak', 	toReturn.status= false; 	toReturn.uiclass = 'danger';	}

			return toReturn;
		}
    }
]);