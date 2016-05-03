angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.settings', {
			url:"/settings",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/settings/settings.html", controller: 'settingsController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('srvcSettings', ['$resource', '$rootScope', '$http', '$q',
	function srvcUsersF($resource, $rootScope, $http, $q) {
		var service = {};

		//service.resource = $resource( '/api/users/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetch = function(){
			var deferred = $q.defer();
			var isMainFinished = false;
			var isCounFinished = false;
			//$rootScope.settings = service.resource.query();
			$http({
				method: 'GET',
				url: '/api/settings'
			}).then(function successCallback(response) {
				$rootScope.settings = response.data;
				isMainFinished = true;
				if(isCounFinished) deferred.resolve("All Finished");
			}, function errorCallback(response) {
				deferred.reject(response.data);
				toastr.error("Settings Fetch Error:<br />" + response.data);
			});

			$http({
				method: 'GET',
				url: '/api/settings/counters'
			}).then(function successCallback(response) {
				$rootScope.counters = response.data;
				isCounFinished = true;
				if(isMainFinished) deferred.resolve("All Finished");
			}, function errorCallback(response) {
				deferred.reject(response.data);
				toastr.error("Counters Fetch Error:<br />" + response.data);
			});
			return deferred.promise;
		};

		service.fetchCollections= function(){
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: '/api/settings/collections'
			}).then(function successCallback(response) {
				console.log("Fetch Collections result:", response);
				$rootScope.collections = response.data;
				deferred.resolve(response.data);
			}, function errorCallback(response) {
				deferred.reject(response.data);
				toastr.error("Collections Fetch Error:<br />" + response.data);
			});

			return deferred.promise;
		};

		service.fetchCountries = function(){
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: '/api/settings/countries'
			}).then(function successCallback(response) {
				$rootScope.countries = response.data;
				deferred.resolve(response.data);
			}, function errorCallback(response) {
				deferred.reject(response.data);
				toastr.error("Countries Fetch Error:<br />" + response.data);
			});
			return deferred.promise;
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


angular.module('adminControllers').controller('settingsController', ['$scope', '$rootScope', 'srvcSettings', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage',
	function($scope, $rootScope, srvcSettings, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage){
		var lnToastr = toastr;

		$scope.save = srvcSettings.save;

		$scope.addPhone = function(){
			if(!$rootScope.settings.phones) $rootScope.settings.phones = [];
			$rootScope.settings.phones.push({country:'US', order:0, number:'000-000-000'});
			console.log($rootScope.settings);
		};

		$scope.deletePhone = function(theOrder){
			if(!confirm("Are you sure you want to delete this phone number?")) return false;
			var toDelete = -1;
			$rootScope.settings.phones.forEach(function(curPhone, curIndex){
				if(curPhone.order == theOrder) {
					console.log(curPhone,curIndex, "This will be deleted");
					toDelete = curIndex;
				}
			});
			if(toDelete >= 0){
				$rootScope.settings.phones.splice(toDelete,1);
				$scope.save();
			}
		};

		//lnToastr.info("We are at settings controller");

	}
]);