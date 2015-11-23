angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.datacenters', {
			url:"/datacenters",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/datacenter/datacenterList.html", controller: 'datacenterController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.datacenternew', {
			url:"/datacenternew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/datacenter/datacenterNew.html", controller: 'datacenterController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.datacenter', {
			url:"/datacenter/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/datacenter/datacenterDetail.html", controller: 'datacenterController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('$datacenter', ['$resource',
	function datacenterService($resource) {
		return ( $resource(
			'/api/datacenter/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);


angular.module('cloudControllers').controller('datacenterController', ['$scope', '$http', '$userService', '$rootScope', '$datacenter', '$state', '$stateParams', '$localStorage', 'srvcLocations',
	function($scope, $http, $userService, $rootScope, $datacenter, $state, $stateParams, $localStorage, srvcLocations) {

		$scope.countries = srvcLocations.countries;

		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchCurDC = function(){
			$scope.curDC = $datacenter.get({id:$stateParams.id}, function(result){
				//here both result and $scope.curDC are the same things.
			});
		};

		if($stateParams.id){
			$scope.fetchCurDC();
		}
		$scope.fetchDCs();


		$scope.saveDC = function(){
			//console.log("Token", $rootScope.apiToken, $localStorage.get('apiToken'));
			$scope.curDC.$update(function(result){
				//console.log(result);
				$rootScope.dataCenters = $datacenter.query();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deleteDC = function(){
			if(confirm("Are you sure you want to delete " + $scope.curDC.name)){
				$scope.curDC.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the data center");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard');
						$scope.fetchDCs();
					}
				});
			}
		};



		$scope.addDC = function(_dcname, _dclocation){
			if(!_dcname){
				$scope.datacenternewalert = "Name can't be empty";
				return 0;
			}
			if(!_dclocation){
				$scope.datacenternewalert = "Location can't be empty";
				return 0;
			}
			$scope.datacenternewalert = '';
			var theNewDC = new $datacenter;
			theNewDC.name = _dcname;
			theNewDC.location = _dclocation;
			$datacenter.save(theNewDC, function(theResult){
				$scope.fetchDCs();
				//For now we are going to dashboard itself. In the future, we should go to details of the datacenter
				$state.go('r.dashboard.datacenters');
			});
		};

		$scope.addDCcancel = function(){
			$state.go('r.dashboard');
		};
	}
]);