angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.servers', {
			url:"/servers",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/server/serverList.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.servernew', {
			url:"/servernew",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/server/serverNew.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.server', {
			url:"/server/:id",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/server/serverDetail.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('$server', ['$resource',
	function serverService($resource) {
		return ( $resource(
			'/api/server/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('serverController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', '$ipblock', '$node', '$image', '$modal', '$http',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, $ipblock, $node, $image, $modal, $http){
		$scope.imageDiskDrivers = [{ value:'virtio', text: 'virtio' }, { value:'ide', text: 'ide'}];
		$scope.imageNetDrivers = [{value:'virtio', text: 'virtio'}, {value:'rtl8139', text: 'Realtek 8139'}, {value:'e1000', text: 'Intel PRO/1000'}];

		$scope.curISOAttachTarget = '';

		$scope.newserver = {
			_dc: '',
			_node: '',
			_image: ''
		};

		$scope.curServerAvailableISOList = [];

		function isInteger(n) {
			n = parseFloat(n);
			return n === +n && n === (n|0);
		}

		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchImages = function(){
			$rootScope.images = $image.query();
		}

		$scope.fetchServers = function(){
			$rootScope.servers = $server.query();
		};

		$scope.fetchPlans = function(){
			$rootScope.plans = $plan.query();
		};

		$scope.listofAllIPs = [];
		$scope.ipFilter = {
			dc: $scope.newserver._dc._id,
			node: $scope.newserver._node._id
		};

		$scope.filterIPList = function(item){
			if(!$scope.newserver){
				return false;
			} else {
				if(!$scope.newserver._dc){
					return false;
				} else {
					if(!$scope.newserver._node){
						if(item.dc == $scope.newserver._dc._id){
							return true;
						} else {
							return false;
						}
					} else {
						if(item.dc == $scope.newserver._dc._id || item.node == $scope.newserver._node._id){
							//console.log("Show", item.ip, item.dc, item.node);
							return true;
						} else {
							//console.log("Hide", item.ip, item.dc, item.node);
							return false;
						}
					}
				}
			}
		};

		$scope.fetchIPBlocks = function(){
			$ipblock.query().$promise.then(function(result){
				result.forEach(function(curIPB){
					curIPB.ips.forEach(function(curIP){
						curIPB.dcs.forEach(function(curIPDC){
							curIP.ipblock = curIPB.name;
							curIP.dc = curIPDC;
						});
						curIPB.nodes.forEach(function(curIPNode){
							curIP.ipblock = curIPB.name;
							curIP.node = curIPNode;
						});
						$scope.listofAllIPs.push(curIP);
					});
				});
				$rootScope.ipblocks = result;
			});

		};

		$scope.fetchNodes = function(){
			$rootScope.nodes = $node.query();
		};

		$scope.fetchDCs();
		$scope.fetchServers();
		$scope.fetchPlans();
		$scope.fetchIPBlocks();
		$scope.fetchNodes();
		$scope.fetchImages();

		$scope.fetchCurServer = function(){
			$scope.curServer = $server.get({id: $stateParams.id}, function(result){
				//here fetch is done.
			});
		};

		$scope.fetchCurServerDisks = function(){
			$http.get('/api/server/listAttachedDisks/'+$stateParams.id).success(function(data, status, headers, config) {
				//console.log("Success:", data);
				$scope.curServer.diskList = data;
			}).error(function(data, status, headers, config) {
				console.log("Error:", data);
			});
		};

		if($stateParams.id){
			$scope.fetchCurServer();
			$scope.fetchCurServerDisks();
		}

		$scope.cancelServerAdd = function(){
			$state.go('r.dashboard.servers');
		};

		$scope.applyPlan = function(thePlan){
			$scope.newserver._cpu = thePlan.cpu;
			$scope.newserver._hdd = thePlan.hdd;
			$scope.newserver._ram = thePlan.ram;
			$scope.newserver._swap = thePlan.swap;
			$scope.newserver._bandwidth = thePlan.bandwidth;
		};

		$scope.addServer = function(){
			if(!$scope.newserver._name){ 					$scope.servernewalert = "Name can't be empty";							return 0;   }
			if(!$scope.newserver._cpu){ 					$scope.servernewalert = "Number of CPU cores can't be empty";			return 0;   }
			if(!isInteger($scope.newserver._cpu)){ 			$scope.servernewalert = "Number of CPU cores should be a whole number";	return 0;   }
			if(!$scope.newserver._hdd){ 					$scope.servernewalert = "HDD size can't be empty";						return 0;   }
			if(!isInteger($scope.newserver._hdd)){ 			$scope.servernewalert = "HDD size should be a whole number";			return 0;   }
			if(!$scope.newserver._ram){ 					$scope.servernewalert = "RAM size can't be empty";						return 0;   }
			if(!isInteger($scope.newserver._ram)){ 			$scope.servernewalert = "RAM size should be a whole number";			return 0;   }
			if(!$scope.newserver._swap){ 					$scope.servernewalert = "Swap size can't be empty";						return 0;   }
			if(!isInteger($scope.newserver._swap)){ 		$scope.servernewalert = "Swap size should be a whole number";			return 0;   }
			if(!$scope.newserver._bandwidth){ 				$scope.servernewalert = "Bandwidth can't be empty";						return 0;   }
			if(!isInteger($scope.newserver._bandwidth)){ 	$scope.servernewalert = "Bandwidth should be a whole number";			return 0;   }
			if(!$scope.newserver._dc){    					$scope.servernewalert = "Please select a datacenter";					return 0;   }
			if(!$scope.newserver._node){    				$scope.servernewalert = "Please select a node";							return 0;   }
			if(!$scope.newserver._ip){    					$scope.servernewalert = "Please select an IP address";					return 0;   }
			if(!$scope.newserver._image){
				if(!$scope.newserver._netdriver){			$scope.servernewalert = "Please select a disk type";					return 0;   }
				if(!$scope.newserver._diskdriver){			$scope.servernewalert = "Please select a network card driver";			return 0;   }
			}

			var theNewServer = {};
			theNewServer.name		= $scope.newserver._name;
			theNewServer.cpu		= $scope.newserver._cpu;
			theNewServer.hdd		= $scope.newserver._hdd;
			theNewServer.ram		= $scope.newserver._ram;
			theNewServer.swap		= $scope.newserver._swap;
			theNewServer.bandwidth	= $scope.newserver._bandwidth;
			theNewServer.dc			= $scope.newserver._dc;
			if(theNewServer.dc != 'AUTO') theNewServer.dc = $scope.newserver._dc._id;
			theNewServer.node		= $scope.newserver._node;
			if(theNewServer.node != 'AUTO') theNewServer.node = $scope.newserver._node._id;
			theNewServer.ip			= $scope.newserver._ip;
			if(theNewServer.ip != 'AUTO') theNewServer.ip = $scope.newserver._ip.ip;
			theNewServer.image		= $scope.newserver._image;
			theNewServer.netdriver	= $scope.newserver._netdriver;
			theNewServer.diskdriver = $scope.newserver._diskdriver;

			$scope.servernewalert = '';
			//console.log("We are ready to deploy");
			//console.log($scope.newserver);
			//console.log(theNewServer);

			$server.save(theNewServer, function(theResult){
				console.log(theResult);
				$scope.fetchServers();
				$state.go('r.dashboard.servers');
			});
		};

		$scope.deleteServer = function(){
			if(confirm("Are you sure you want to delete " + $scope.curServer.name)){
				$scope.curServer.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the storage");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard.servers');
						$scope.fetchServers();
					}
				});
			}
		};

		$scope.openAttachISOModal = function(theTarget){
			console.log("Opening attach iso modal screen");
			$scope.curServerAvailableISOList = [];
			$scope.curISOAttachTarget = theTarget;
			$http.get('/api/server/getAvailableISOfiles/' + $scope.curServer._id).success(function(data, status, headers, config){
				$scope.curServerAvailableISOList = data;
			}).error(function(data, status, headers, config){
				console.log(data);
			});
			$scope.attachISOmodalInstance = $modal.open({
				animation: true,
				templateUrl: "serverAttachIsoModal.tmpl.html",
				size: 'lg',
				scope: $scope
			});

			$scope.attachISOmodalInstance.result.then(function(result){
				console.log("Result:", result);
			}, function(issue){
				console.log("Issue:", issue);
			});
		};

		$scope.closeAttachISOModal = function(){
			$scope.attachISOmodalInstance.dismiss();
		};

		$scope.attachISO = function(isoid){
			$http.get('/api/server/attachISO/'+ isoid +'/'+ $scope.curServer._id +'/'+$scope.curISOAttachTarget).success(function(data, status, headers, config){
				$scope.closeAttachISOModal();
				$scope.fetchCurServerDisks();
			}).error(function(data, status, headers, config){
				console.log(data);
			});
		};

		$scope.ejectISO = function(ISOtarget){
			$http.get('/api/server/ejectISO/'+ $scope.curServer._id +'/'+ ISOtarget).success(function(data, status, headers, config) {
				$scope.fetchCurServerDisks();
			}).error(function(data, status, headers, config) {
				console.log(data);
			});
		};
	}
]);