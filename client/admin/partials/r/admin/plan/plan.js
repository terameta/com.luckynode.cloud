angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.plans', {
			url:"/plans",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/plan/planList.html", controller: 'planController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.plannew', {
			url:"/plannew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/plan/planNew.html", controller: 'planController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.plan', {
			url:"/plan/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/plan/planDetail.html", controller: 'planController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('$plan', ['$resource',
	function planService($resource) {
		return ( $resource(
			'/api/plan/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('planController', ['$scope', '$rootScope', '$state', '$stateParams', '$plan',
	function($scope, $rootScope, $state, $stateParams, $plan){
		$scope.fetchPlans = function(){
			$rootScope.plans = $plan.query();
		};

		$scope.fetchPlans();

		$scope.fetchCurPlan = function(){
			$scope.curPlan = $plan.get({id:$stateParams.id}, function(result){
				//here fetch is done.
			});
		};

		if($stateParams.id){
			$scope.fetchCurPlan();
		}

		function isInteger(n) {
			n = parseFloat(n);
			return n === +n && n === (n|0);
		}

		$scope.addPlan = function(_name, _cpu, _hdd, _ram, _swap, _bandwidth, _price){
			if(!_name){ 					$scope.plannewalert = "Name can't be empty";							return 0; }
			if(!_cpu){ 						$scope.plannewalert = "Number of CPU cores can't be empty";				return 0; }
			if(!isInteger(_cpu)){ 			$scope.plannewalert = "Number of CPU cores should be a whole number";	return 0; }
			if(!_hdd){ 						$scope.plannewalert = "HDD size can't be empty";						return 0; }
			if(!isInteger(_hdd)){ 			$scope.plannewalert = "HDD size should be a whole number";				return 0; }
			if(!_ram){ 						$scope.plannewalert = "RAM size can't be empty";						return 0; }
			if(!isInteger(_ram)){ 			$scope.plannewalert = "RAM size should be a whole number";				return 0; }
			if(!_bandwidth){ 				$scope.plannewalert = "Bandwidth can't be empty";						return 0; }
			if(!isInteger(_bandwidth)){ 	$scope.plannewalert = "Bandwidth should be a whole number";				return 0; }

			$scope.plannewalert = '';

			var theNewPlan = new $plan;
			theNewPlan.name 		= _name;
			theNewPlan.cpu 			= _cpu;
			theNewPlan.hdd 			= _hdd;
			theNewPlan.ram 			= _ram;
			theNewPlan.bandwidth	= _bandwidth;
			theNewPlan.price		= _price;
			$plan.save(theNewPlan, function(theResult){
				$scope.fetchPlans();
				$state.go('r.dashboard.plans');
			});
		};

		$scope.cancelPlanAdd = function(){
			$state.go('r.dashboard.plans');
		};

		$scope.savePlan = function(){
			$scope.curPlan.$update(function(result){
				$scope.fetchPlans();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deletePlan = function(){
			if(confirm("Are you sure you want to delete " + $scope.curPlan.name)){
				$scope.curPlan.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the storage");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard.plans');
						$scope.fetchPlans();
					}
				});
			}
		};
	}
]);