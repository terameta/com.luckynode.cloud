angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.storages', {
			url:"/storages",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/storage/storageList.html", controller: 'storageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.storagenew', {
			url:"/storagenew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/storage/storageNew.html", controller: 'storageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.storage', {
			url:"/storage/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/storage/storageDetail.html", controller: 'storageController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('$storage', ['$resource',
	function storageService($resource) {
		return ( $resource(
			'/api/storage/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('storageController', ['$scope', '$rootScope', '$state', '$stateParams', '$storage', '$datacenter', '$http',
	function($scope, $rootScope, $state, $stateParams, $storage, $datacenter, $http){
		var lnToastr = toastr;
		$scope.storageTypes = [
			{ name:'NFS' }
		];

		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchStorages = function(){
			$rootScope.storages = $storage.query();
		};

		$scope.fetchDCs();
		$scope.fetchStorages();

		$scope.fetchCurStorage = function(){
			$scope.curStorage = $storage.get({id:$stateParams.id}, function(result){
				//here fetch is done.
			});

			$http.get('/api/storage/getPoolFiles/'+$stateParams.id).
				success(function(data, status, headers, config) {
					console.log(data);
					lnToastr.info("Pool files are received");
				}).
				error(function(data, status, headers, config) {
					console.log(data);
					lnToastr.error("Can't receive files in storage");
				});
		};

		if($stateParams.id){
			$scope.fetchCurStorage();
		}

		$scope.cancelStorageAdd = function(){
			$state.go('r.dashboard.storages');
		};

		$scope.addStorage = function(_name, _datacenter, _type, _source){
			if(!_name){ 					$scope.storagenewalert = "Name can't be empty";				return 0; }
			if(!_datacenter){ 				$scope.storagenewalert = "Datacenter can't be empty";		return 0; }
			if(!_type){ 					$scope.storagenewalert = "Type can't be empty";				return 0; }
			if(!_source){ 					$scope.storagenewalert = "Source can't be empty";			return 0; }
			$scope.storagenewalert = '';
			var theNewStorage = new $storage;
			theNewStorage.name = _name;
			theNewStorage.datacenter = _datacenter._id;
			theNewStorage.type = _type.name;
			theNewStorage.source = _source;
			$storage.save(theNewStorage, function(theResult){
				$scope.fetchStorages();
				//For now we are going to dashboard itself. In the future, we should go to details of the datacenter
				$state.go('r.dashboard.storages');
			});
		};

		$scope.saveStorage = function(){
			$scope.curStorage.$update(function(result){
				$scope.fetchStorages();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deleteStorage = function(){
			if(confirm("Are you sure you want to delete " + $scope.curStorage.name)){
				$scope.curStorage.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the storage");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard.storages');
						$scope.fetchStorages();
					}
				});
			}
		};
	}
]);