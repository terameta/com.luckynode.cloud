var cloudApp = angular.module('cloudApp', ['ui.router', 'cloudControllers', 'cloudServices', 'ngSanitize', 'ui.bootstrap', 'angular-loading-bar', 'xeditable', 'checklist-model']);

cloudApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("r/welcome");

    $stateProvider.
        state('r', {                                                           //r for root
            url: "/r",
            templateUrl: "/partials/r/r.html",
            data: { requireSignin: false }
        }).state('r.welcome',{
            url: "/welcome",
            views: {
            	'':				{templateUrl: "/partials/r/guest/welcome.html"},
            	//'mainMenu':		{templateUrl: "/partials/r/guest/welcomeMenu.html"},
            	'mainBody':		{templateUrl: "/partials/r/guest/welcomeBody.html"}
            },
            data: { requireSignin: false }
		}).state('r.dashboard', {
			url:"/dashboard",
			views: {
				'': 			{ templateUrl: "/partials/r/admin/dashboard.html" },
				'mainMenu': 	{ templateUrl: "/partials/r/admin/dashboardMenu.html" },
				'mainBody':		{ templateUrl: "/partials/r/admin/dashboardBody.html", controller: 'dashboardController' },
				'sidebar@r.dashboard': { templateUrl: "/partials/r/admin/dashboardSideBar.html" },
				'content@r.dashboard': { templateUrl: "/partials/r/admin/dashboardContent.html" }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.datacenters', {
			url:"/datacenters",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/datacenter/datacenterList.html", controller: 'datacenterController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.datacenternew', {
			url:"/datacenternew",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/datacenter/datacenterNew.html", controller: 'datacenterController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.datacenter', {
			url:"/datacenter/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/datacenter/datacenterDetail.html", controller: 'datacenterController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.nodes', {
			url:"/nodes",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/node/nodeList.html", controller: 'nodeController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.nodenew', {
			url:"/nodenew",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/node/nodeNew.html", controller: 'nodeController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.node', {
			url:"/node/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/node/nodeDetail.html", controller: 'nodeController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.ipblocks', {
			url:"/ipblocks",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/ipblock/ipblockList.html", controller: 'ipblockController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.ipblocknew', {
			url:"/ipblocknew",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/ipblock/ipblockNew.html", controller: 'ipblockController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.ipblock', {
			url:"/ipblock/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/ipblock/ipblockDetail.html", controller: 'ipblockController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.storages', {
			url:"/storages",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/storage/storageList.html", controller: 'storageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.storagenew', {
			url:"/storagenew",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/storage/storageNew.html", controller: 'storageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.storage', {
			url:"/storage/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/storage/storageDetail.html", controller: 'storageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.plans', {
			url:"/plans",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/plan/planList.html", controller: 'planController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.plannew', {
			url:"/plannew",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/plan/planNew.html", controller: 'planController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.plan', {
			url:"/plan/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/plan/planDetail.html", controller: 'planController' }
			},
			data: { requireSignin: true }
		}).state('r.signout', {
			url: "/signout",
			views: {
				'': 			{ templateUrl: "/partials/r/guest/welcome.html"},
				'mainMenu':		{ templateUrl: "/partials/r/admin/dashboardMenu.html" },
				'mainBody':		{ templateurl: "/partials/r/admin/dashboardBody.html", controller: 'signoutController'  }
			},
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