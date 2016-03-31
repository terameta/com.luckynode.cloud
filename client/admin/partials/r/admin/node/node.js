angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.nodes', {
			url:"/nodes",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/node/nodeList.html", controller: 'nodeController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.nodenew', {
			url:"/nodenew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/node/nodeNew.html", controller: 'nodeController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.node', {
			url:"/node/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/node/nodeDetail.html", controller: 'nodeController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('$node', ['$resource',
	function nodeService($resource) {
		return ( $resource(
			'/api/node/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('adminControllers').controller('nodeController', ['$scope', '$rootScope', '$node', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage', '$sce',
	function($scope, $rootScope, $node, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage, $sce){
		$scope.newnode = {};
		function validIP4(toCheck) {
			var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
			return (toCheck.match(ipformat));
		}

		$scope.deployCreds = {};

		$scope.restartNode = function(){
			console.log("Restarting the server");
			$http.get('/api/node/restart/' + $scope.curNode._id).
				success(function(data, status, headers, config){
					console.log("success");
					console.log(data);
				}).
				error(function(data, status, headers, config){
					console.log("fail");
					console.log(data);
				});
		};

		$scope.assignAsActiveBridge = function(theBridge){
			$scope.curNode.netBridge = theBridge;
			$scope.saveNode();
		};

		$scope.openNetworkBridgeScreen = function(){
			console.log("Opening network bridge screen");
			$http.get('/api/node/getInterfaces/' + $scope.curNode._id).
				success(function(data, status, headers, config){
					$scope.curNode.interfaces = data;
					$scope.curNode.interfaces.forEach(function(curInt){
						if(curInt.name.indexOf('br') >= 0){
							curInt.type = 'bridge';
						} else if(curInt.name.indexOf('lo') >= 0){
							curInt.type = 'loopback adapter';
						} else {
							curInt.type = 'ethernet';
						}
					});
					$scope.saveNode();
				}).
				error(function(data, status, headers, config){
					$scope.curNode.interfaces = 'Failed';
				});
			$scope.nbmodalInstance = $uibModal.open({
				animation: true,
				templateUrl: "nodeNetworkBridgeModal.tmpl.html",
				size: 'lg',
				scope: $scope
			});

			$scope.nbmodalInstance.result.then(function(result){
				console.log("Result:", result);
			}, function(issue){
				console.log("Issue:", issue);
			});
		};

		$scope.closeNetworkBridgeScreen = function(){
			$scope.nbmodalInstance.dismiss();
		};

		$scope.bridgeAssign = function(curAdapter){
			$http.post('/api/node/bridgeAssign/'+$scope.curNode._id, { adapter: curAdapter }).
				success(function(data, status, headers, config) {
					//console.log("success");
					$scope.closeNetworkBridgeScreen();
					$scope.openNetworkBridgeScreen();
				}).
				error(function(data, status, headers, config) {
					//console.log("fail");
					//console.log(data);
					alert("Bridge assignment failed with message: " + data.detail);
					$scope.closeNetworkBridgeScreen();
					$scope.openNetworkBridgeScreen();
				});
		};

		$scope.bridgeDetach = function(curBridge){
			$http.post('/api/node/bridgeDetach/'+$scope.curNode._id, { bridge: curBridge }).
				success(function(data, status, headers, config) {
					$scope.closeNetworkBridgeScreen();
					$scope.openNetworkBridgeScreen();
					$scope.saveNode();
				}).
				error(function(data, status, headers, config) {
					//console.log("fail");
					//console.log(data);
					alert("Bridge assignment failed with message: " + data.detail);
					$scope.closeNetworkBridgeScreen();
					$scope.openNetworkBridgeScreen();
				});
		};

		$scope.openDeployScreen = function() {
			console.log("Opening deploy screen");
			$scope.modalInstance = $uibModal.open({
				animation: false,
				templateUrl: "nodeDeployModal.tmpl.html",
				size: 'lg',
				scope: $scope
			});

			$scope.modalInstance.result.then(function(result) {
				console.log("Result", result);
			}, function(issue) {
				console.log("Issue", issue);
			});
		};

		$scope.closeDeployScreen = function() {
			$scope.modalInstance.dismiss();
		};

		$scope.getLNTimeFormat = function(){
			var currentdate = new Date();
			return $scope.padTime(currentdate.getHours(),2) + ":" + $scope.padTime(currentdate.getMinutes(),2) + ":" + $scope.padTime(currentdate.getSeconds(),2);
		};

		$scope.padTime = function(n, width, z){
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		};

		$scope.deployNodeSteps = function() {
			console.log("deploynodesteps");
			$http.get('/api/node/deploystatus/' + $scope.curNode._id).
			success(function(data, status, headers, config){
				if($scope.deployStatus){
					if($scope.deployStatus.steps){
						console.log(data.step, data.status);
						$scope.deployStatus.steps[data.step].status = data.status;
						$scope.deployStatus.steps.forEach(function(a,b){
							if(parseInt(b, 10) < parseInt(data.step,10) - 1) a.status = 'success';
						});
					}
				}
				if(parseInt(data.step,10) < parseInt($scope.deployStatus.steps.length, 10) -1 && data.status == 'success')
					setTimeout($scope.deployNodeSteps,1000);
				if(parseInt(data.step,10) == parseInt($scope.deployStatus.steps.length, 10) -1 && data.status == 'success'){
					console.log("Deploy succeeded");
					$scope.curNode.status = 'Deployed';
					$scope.saveNode();
				}
			}).
			error(function(data, status, headers, config){
				$scope.deployStatus.steps[data.step].status = 'danger';
				$scope.curNode.status = 'Deployment Failed';
				$scope.saveNode();
			});
		};

		$scope.deployNode = function() {
			$http.post('/api/node/deploy/0/'+$scope.curNode._id, $scope.deployCreds).
				success(function(data, status, headers, config) {
					//console.log("success");
					//console.log(data.steps.length);
					$scope.deployStatus = data;
					$scope.deployNodeSteps();
				}).
				error(function(data, status, headers, config) {
					console.log("fail");
					console.log(data);
					$scope.deployStatus = data;
				});
		};

		$scope.fetchNodes = function(){
			$rootScope.nodes = $node.query();
		};

		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchCurNode = function(){
			$scope.curNode = $node.get({id:$stateParams.id}, function(result){
				//here fetch is done.
			});
		};

		if($stateParams.id){
			$scope.fetchCurNode();
		}

		$scope.fetchStorages = function(){
			$rootScope.storages = $storage.query();
		};

		$scope.fetchStorages();
		$scope.fetchDCs();
		$scope.fetchNodes();

		$scope.addNode = function(_name, _datacenter, _ipaddress, _internalip){
			if(!$scope.newnode._name){
				$scope.nodenewalert = "Name can't be empty";
				return 0;
			}
			if(!$scope.newnode._datacenter){
				$scope.nodenewalert = "Data center can't be empty";
				return 0;
			}
			if(!$scope.newnode._ipaddress){
				$scope.nodenewalert = "IP address can't be empty";
				return 0;
			}
			if(!validIP4($scope.newnode._ipaddress)){
				$scope.nodenewalert ="IP address is not valid";
				return 0;
			}
			if($scope.newnode._internalip){
				if(!validIP4($scope.newnode._internalip)){
					$scope.nodenewalert = 'Internal IP address is not valid';
					return 0;
				}
			}


			$scope.nodenewalert = '';
			var theNewNode = new $node;
			theNewNode.name = $scope.newnode._name;
			theNewNode.datacenter = $scope.newnode._datacenter._id;
			theNewNode.ip = $scope.newnode._ipaddress;
			if($scope.newnode._internalip) theNewNode.internalip = $scope.newnode._internalip;
			$node.save(theNewNode, function(theResult){
				$scope.fetchNodes();
				//For now we are going to dashboard itself. In the future, we should go to details of the datacenter
				$state.go('r.dashboard.nodes');
			});
		};

		$scope.addNodecancel = function(){
			$state.go('r.dashboard.nodes');
		};

		$scope.saveNode = function(){
			$scope.curNode.$update(function(result){
				$rootScope.nodes = $node.query();
				$scope.fetchCurNode();
			}, function(error){
				console.log(error);
			});
		};

		$scope.checkStorageChange = function(theData){
			if(!$scope.curNode.storage) $scope.curNode.storage = '';
			if(!theData){
				$scope.curNode.storageChanged = false;
			} else if(theData.toString() != $scope.curNode.storage.toString()){
				$scope.curNode.storageChanged = true;
			} else {
				$scope.curNode.storageChanged = false;
			}
		};

		$scope.deleteNode = function(){
			if(confirm("Are you sure you want to delete " + $scope.curNode.name)){
				$scope.curNode.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the node");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard.nodes');
						$scope.fetchNodes();
					}
				});
			}
		};

		$scope.presentSource = function(src){
			var toReturn = '<li>'+src.name+'<ul>Sources<ul>';
			var sources = src.source.toString().split(',');
			sources.forEach(function(curSrc){
				toReturn += "<li>"	+ curSrc + "</li>";
			});
			toReturn = $sce.trustAsHtml(toReturn);
			return toReturn;
		};

	}
]);