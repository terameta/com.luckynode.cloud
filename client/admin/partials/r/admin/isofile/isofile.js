angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.isofiles', {
			url:"/isofiles",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/isofile/isofileList.html", controller: 'isofileController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.isofilenew', {
			url:"/isofilenew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/isofile/isofileNew.html", controller: 'isofileController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.isofile', {
			url:"/isofile/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/isofile/isofileDetail.html", controller: 'isofileController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('$isofile', ['$resource',
	function serverService($resource) {
		return ( $resource(
			'/api/isofile/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('adminControllers').controller('isofileController', ['$scope', '$rootScope', '$isofile', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage',
	function($scope, $rootScope, $isofile, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage){
		$scope.isofiletypes = [{name: 'iso', value: 'iso'}];
		$scope.isoarchitectures = [{name: 'i386', value: 'i386'}, {name: 'x86_64', value: 'x86_64'}];
		$scope.isostatuses = [{name:'Public', value:'public'}, {name: 'Enabled', value: 'enabled'}, {name: 'Disabled', value: 'disabled'}];

		$scope.newIsofile = {
			_isofiletype: 'iso',
			_status: 'enabled',
			_architecture: 'x86_64'
		};
		$scope.selectedStorageIsos = [];

		$scope.fetchIsofiles = function(){
			$rootScope.isofiles = $isofile.query();
		};

		$scope.fetchStorages = function(){
			$rootScope.storages = $storage.query();
		};

		$scope.fetchIsofiles();
		$scope.fetchStorages();

		$scope.fetchCurIsofile = function(){
			$scope.curIsofile = $isofile.get({id: $stateParams.id}, function(result){
				//console.log(result);
				$scope.isofileStoreChange(result.pool);
			});
		};

		if($stateParams.id){
			$scope.fetchCurIsofile();
		}


		$scope.addIsofile = function(){
			console.log($scope.newIsofile);
		};

		$scope.isofileStoreChange = function(poolid){
			if($scope.newIsofile){
				if($scope.newIsofile._pool){
					if($scope.newIsofile._pool._id) if(!poolid) poolid = $scope.newIsofile._pool._id;
				}
			}
			if(!poolid) return false;
			$http.get('/api/isofile/listIsofilesInStore/'+poolid).
				success(function(data, status, headers, config) {
					$scope.selectedStorageIsos = data;
				}).
				error(function(data, status, headers, config) {
					console.log(data);
				});
		};

		$scope.addIsofile = function(){
			if(!$scope.newIsofile._name){ 					$scope.isofilenewalert = "Name can't be empty";							return 0;   }
			if(!$scope.newIsofile._file){ 					$scope.isofilenewalert = "File can't be empty";							return 0;   }
			if(!$scope.newIsofile._isofiletype){			$scope.isofilenewalert = "Please choose a file type";					return 0;   }
			if(!$scope.newIsofile._status){ 				$scope.isofilenewalert = "Please choose a status for the iso file";		return 0;   }
			if(!$scope.newIsofile._architecture){			$scope.isofilenewalert = "Please choose an architecture for the file";	return 0;   }
			$scope.isofilenewalert = "";
			var theNewIsoFile = {};
			theNewIsoFile.name = $scope.newIsofile._name;
			theNewIsoFile.pool = $scope.newIsofile._pool._id;
			theNewIsoFile.file = $scope.newIsofile._file.name;
			theNewIsoFile.isofiletype = $scope.newIsofile._isofiletype;
			theNewIsoFile.status = $scope.newIsofile._status;
			theNewIsoFile.architecture = $scope.newIsofile._architecture;
			theNewIsoFile.description = $scope.newIsofile._description;
			//console.log(theNewIsoFile);
			$isofile.save(theNewIsoFile, function(theResult){
			//	console.log(theResult);
				$scope.fetchIsofiles();
				$state.go('r.dashboard.isofiles');
			});
		};

		$scope.cancelIsofileAdd = function(){
			$state.go('r.dashboard.isofiles');
		};

		$scope.saveIsofile = function(){
			$scope.curIsofile.$update(function(result){
				$scope.fetchIsofiles();
				$scope.fetchCurIsofile();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deleteIsofile = function(){
			if(confirm("Are you sure you want to delete " + $scope.curIsofile.name)){
				$scope.curIsofile.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the isofile");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$scope.fetchIsofiles();
						$state.go('r.dashboard.isofiles');
					}
				});
			}
		};
	}
]);