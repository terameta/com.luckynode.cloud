angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
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

angular.module('adminServices').service('$storage', ['$resource',
	function storageService($resource) {
		return ( $resource(
			'/api/storage/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('adminControllers').controller('storageController', ['$scope', '$rootScope', '$state', '$stateParams', '$storage', '$datacenter', '$http',
	function($scope, $rootScope, $state, $stateParams, $storage, $datacenter, $http){
		var lnToastr = toastr;
		$scope.storageTypes = [
			{ name:'NFS' },
			{ name:'ceph'}
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
			console.log("FetchCurStorage called");
			$scope.curStorage = $storage.get({id:$stateParams.id}, function(result){
				//here fetch is done.
				console.log($scope.curStorage);
				console.log("Secret UUID", $scope.curStorage.secretuuid);
				if(!$scope.curStorage.secretuuid) $scope.redefineSecretUUID();
			});

			$http.post('/api/storage/converged/', { id: $stateParams.id, command: 'getFiles' }).
				success(function(data, status, headers, config) {
					$scope.storageFiles = data;
				}).
				error(function(data, status, headers, config) {
					console.log(data);
					lnToastr.error("Can't receive files in storage");
				});
		};

		$scope.redefineSecretUUID = function(){
			console.log("Redefining");
			if(confirm("We will now redefine the pool's secret uuid, proceed?")){
				$http.post('/api/storage/definesecretuuid', {id: $stateParams.id}).
				success(function(data, status, headers, config){
					$scope.fetchCurStorage();
				}).
				error(function(data, status, headers, config){
					lnToastr.error("Failed to generade secret UUID");
				});
			}
		};

		$scope.pushSecrettoNodes = function(){
			if(confirm("We will now push the secret definition to the nodes, proceed?")){
				lnToastr.info("Secret definition is started");
				$http.post('/api/storage/pushSecrettoNodes', {id: $stateParams.id}).
				success(function(data, status, headers, config){

				}).error(function(data, status, headers, config){
					lnToastr.error("Failed to push the secret definition.");
					console.log("Failed to push the secret definition.");
					console.log(data);
				});
			} else {
				lnToastr.info("Secret definition is cancelled");
			}
		};

		$scope.getSecretAssignments = function(){
			$http.post('/api/storage/getSecretAssignments', {id: $stateParams.id}).
			success(function(data, status, headers, config){
				console.log("GetSecretAssignments");
				console.log(data);
			}).error(function(data, status, headers, config){
				lnToastr.error("Failed to get the secret assignments.");
				console.log("Failed to get the secret assignments.");
				console.log(data);
				lnToastr.error(data);
			});
		};

		if($stateParams.id){
			$scope.fetchCurStorage();
			$scope.getSecretAssignments();
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
				$scope.fetchCurStorage();
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