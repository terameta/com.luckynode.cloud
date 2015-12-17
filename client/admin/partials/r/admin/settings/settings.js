angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.settings', {
			url:"/settings",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/settings/settings.html", controller: 'settingsController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcSettings', ['$resource', '$rootScope', '$http',
	function srvcUsersF($resource, $rootScope, $http) {
		var service = {};

		//service.resource = $resource( '/api/users/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetch = function(){
			//$rootScope.settings = service.resource.query();
			$http({
				method: 'GET',
				url: '/api/settings'
			}).then(function successCallback(response) {
				$rootScope.settings = response.data;
			}, function errorCallback(response) {
				toastr.error("Settings Fetch Error:<br />" + response.data);
			});

			$http({
				method: 'GET',
				url: '/api/settings/counters'
			}).then(function successCallback(response) {
				console.log(response);
				$rootScope.counters = response.data;
			}, function errorCallback(response) {
				toastr.error("Counters Fetch Error:<br />" + response.data);
			});
		};

		service.save = function(){
			$http({
				method: 'POST',
				url: '/api/settings',
				data: $rootScope.settings
			}).then(function successCallback(response) {
				toastr.info("Settings saved");
			}, function errorCallback(response) {
				toastr.error("Settings Save Error:<br />" + response.data);
			});
		};


		service.fetch();

		return service;
	}
]);


angular.module('cloudControllers').controller('settingsController', ['$scope', '$rootScope', 'srvcSettings', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage',
	function($scope, $rootScope, srvcSettings, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage){
		var lnToastr = toastr;

		$scope.save = srvcSettings.save;

		//lnToastr.info("We are at settings controller");

	}
]);