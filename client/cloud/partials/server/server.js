angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.server',{
			url: "/server",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/server/server.html", controller: 'ctrlServer' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcServer', ['$resource', '$rootScope',
	function srvcEndUser($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/client/server/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchServers = function(){
			//console.log("Fetching servers");
			$rootScope.servers = service.resource.query(function(result){
				//console.log(result);
			});
		};

		service.fetchServers();

		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlServer', ['$scope', '$http', '$rootScope', '$state', '$stateParams', '$uibModal', 'srvcDataCenter', 'srvcServer', 'srvcPlan', 'srvcImage',
	function($scope, $http, $rootScope, $state, $stateParams, $uibModal, srvcDataCenter, srvcServer, srvcPlan, srvcImage) {
		var lnToastr = toastr;

		$scope.curNewServer = {
			cpu: 2,
			ram: 2,
			hdd: 20,
			ips: 1
		};

		$scope.orderServer = function(){
			console.log("We are ordering a server");
			$scope.nbmodalInstance = $uibModal.open({
				animation: true,
				templateUrl: "/cloud/partials/server/serverOrderModal.html",
				size: 'lg',
				scope: $scope
			});

			$scope.nbmodalInstance.opened.then(function(){
				var curInterval = setInterval(function(){
					if($("#serverram").val()){
						clearInterval(curInterval);
						$scope.prepareSliders();
					}
				},10);
			});

			$scope.prepareSliders = function(){
				$("#serverram").ionRangeSlider({	type: "single", min: 1,		max: 64,		step: 1,		grid: true,	grid_snap: true, force_edges: true, values: [1,2,4,6,8,10,12,16,20,24,28,32,36,48,64] });
				$("#servercpu").ionRangeSlider({	type: "single", min: 1,		max: 16,		step: 1,		grid: true,	grid_snap: true, force_edges: true });
				$("#serverhdd").ionRangeSlider({	type: "single", min: 20,	max: 1000,	step: 10,	grid: true,	grid_snap: true, force_edges: true });
			};
		};


	}
]);