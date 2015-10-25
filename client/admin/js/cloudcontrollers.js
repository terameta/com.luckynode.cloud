var cloudControllers = angular.module('cloudControllers', []);

cloudControllers.controller('planController', ['$scope', '$rootScope', '$state', '$stateParams', '$plan',
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

		$scope.addPlan = function(_name, _cpu, _hdd, _ram, _swap, _bandwidth){
			if(!_name){ 					$scope.plannewalert = "Name can't be empty";							return 0; }
			if(!_cpu){ 						$scope.plannewalert = "Number of CPU cores can't be empty";				return 0; }
			if(!isInteger(_cpu)){ 			$scope.plannewalert = "Number of CPU cores should be a whole number";	return 0; }
			if(!_hdd){ 						$scope.plannewalert = "HDD size can't be empty";						return 0; }
			if(!isInteger(_hdd)){ 			$scope.plannewalert = "HDD size should be a whole number";				return 0; }
			if(!_ram){ 						$scope.plannewalert = "RAM size can't be empty";						return 0; }
			if(!isInteger(_ram)){ 			$scope.plannewalert = "RAM size should be a whole number";				return 0; }
			if(!_swap){ 					$scope.plannewalert = "Swap size can't be empty";						return 0; }
			if(!isInteger(_swap)){ 			$scope.plannewalert = "Swap size should be a whole number";				return 0; }
			if(!_bandwidth){ 				$scope.plannewalert = "Bandwidth can't be empty";						return 0; }
			if(!isInteger(_bandwidth)){ 	$scope.plannewalert = "Bandwidth should be a whole number";				return 0; }

			$scope.plannewalert = '';

			var theNewPlan = new $plan;
			theNewPlan.name 		= _name;
			theNewPlan.cpu 			= _cpu;
			theNewPlan.hdd 			= _hdd;
			theNewPlan.ram 			= _ram;
			theNewPlan.swap			= _swap;
			theNewPlan.bandwidth	= _bandwidth;
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

cloudControllers.controller('storageController', ['$scope', '$rootScope', '$state', '$stateParams', '$storage', '$datacenter',
	function($scope, $rootScope, $state, $stateParams, $storage, $datacenter){
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

cloudControllers.controller('ipblockController', ['$scope', '$rootScope', '$state', '$stateParams', '$ipblock', '$datacenter', '$node',
	function($scope, $rootScope, $state, $stateParams, $ipblock, $datacenter, $node){
		function validIP4(toCheck) {
			var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
			return (toCheck.match(ipformat));
		}

		function validMAC(toCheck){
			var macformat = /^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/;
			return(macformat.test(toCheck));
		}

		$scope.checkMAC = function(toCheck){
			var toReturn = validMAC(toCheck);
			if(!toReturn && toCheck !=''){
				return("MAC address entered is not valid");
			}
			//return(toReturn);
		};

		$scope.singleIPformvisible = false;
		$scope.multipleIPformvisible = false;

		$scope.showhidesingleIPform = function(){
			$scope.singleIPformvisible = !$scope.singleIPformvisible;
			if($scope.singleIPformvisible) $scope.multipleIPformvisible = false;
		};

		$scope.showhidemultipleIPform = function(){
			$scope.multipleIPformvisible = !$scope.multipleIPformvisible;
			if($scope.multipleIPformvisible) $scope.singleIPformvisible = false;
		};

		$scope.deleteIPfromBlock = function(_theIP){
			if(confirm("Are you sure you want to delete " + _theIP)){
				$scope.curBlock.ips.forEach(function(_curBlockIP, _curBlockIndex){
					if(_curBlockIP.ip == _theIP){
						$scope.curBlock.ips.splice(_curBlockIndex, 1);
					}
				});
				$scope.saveIPBlock();
			}
		};

		$scope.addSingleIP = function(_theIP){
			if(!_theIP){ 					$scope.singleIPformalert = "IP address can't be empty";				return 0; }
			if(!validIP4(_theIP)){ 			$scope.singleIPformalert = "IP address is invalid"; 				return 0; }
			if(!$scope.curBlock.ips) $scope.curBlock.ips = [];
			var ipToPush = {};
			ipToPush.ip = _theIP;
			ipToPush.mac = '';
			$scope.curBlock.ips.push(ipToPush);
			$scope.saveIPBlock();
			$scope.singleIPformvisible = false;
		};

		$scope.addMultipleIP = function(_theIP1, _theIP2){
			if(!_theIP1){ 					$scope.multipleIPformalert = "First IP address can't be empty";		return 0; }
			if(!_theIP2){ 					$scope.multipleIPformalert = "Last IP address can't be empty";		return 0; }
			if(!validIP4(_theIP1)){			$scope.multipleIPformalert = "First IP address is invalid";			return 0; }
			if(!validIP4(_theIP2)){			$scope.multipleIPformalert = "Last IP address is invalid";			return 0; }
			if(!$scope.curBlock.ips) $scope.curBlock.ips = [];
			var _theIP1Array = _theIP1.split('.');
			var _theIP2Array = _theIP2.split('.');
			_theIP1Array[0] = '000' + _theIP1Array[0]; _theIP1Array[0] = _theIP1Array[0].substring(_theIP1Array[0].length - 3);
			_theIP1Array[1] = '000' + _theIP1Array[1]; _theIP1Array[1] = _theIP1Array[1].substring(_theIP1Array[1].length - 3);
			_theIP1Array[2] = '000' + _theIP1Array[2]; _theIP1Array[2] = _theIP1Array[2].substring(_theIP1Array[2].length - 3);
			_theIP1Array[3] = '000' + _theIP1Array[3]; _theIP1Array[3] = _theIP1Array[3].substring(_theIP1Array[3].length - 3);
			_theIP2Array[0] = '000' + _theIP2Array[0]; _theIP2Array[0] = _theIP2Array[0].substring(_theIP2Array[0].length - 3);
			_theIP2Array[1] = '000' + _theIP2Array[1]; _theIP2Array[1] = _theIP2Array[1].substring(_theIP2Array[1].length - 3);
			_theIP2Array[2] = '000' + _theIP2Array[2]; _theIP2Array[2] = _theIP2Array[2].substring(_theIP2Array[2].length - 3);
			_theIP2Array[3] = '000' + _theIP2Array[3]; _theIP2Array[3] = _theIP2Array[3].substring(_theIP2Array[3].length - 3);

			_theIP1Array = parseInt(_theIP1Array.join(''));
			_theIP2Array = parseInt(_theIP2Array.join(''));
			if(_theIP1Array > _theIP2Array){
				var curTemp = _theIP1Array;
				_theIP1Array = _theIP2Array;
				_theIP2Array = curTemp;
			}
			for(var curIP = _theIP1Array; curIP <= _theIP2Array; curIP++){
				var curIPtoAdd = curIP.toString().match(/.{1,3}/g);
				curIPtoAdd[0] = parseInt(curIPtoAdd[0]).toString();
				curIPtoAdd[1] = parseInt(curIPtoAdd[1]).toString();
				curIPtoAdd[2] = parseInt(curIPtoAdd[2]).toString();
				curIPtoAdd[3] = parseInt(curIPtoAdd[3]).toString();
				curIPtoAdd = curIPtoAdd.join('.');
				if(validIP4(curIPtoAdd)){
					var ipToPush = {};
					ipToPush.ip = curIPtoAdd;
					ipToPush.mac = '';
					$scope.curBlock.ips.push(ipToPush);
				}
			}
			$scope.saveIPBlock();
			$scope.multipleIPformvisible = false;
		};

		$scope.showBlockDCs = function(){
			var toReturn = [];
			if($scope.curBlock.dcs && $rootScope.dataCenters){
				$scope.curBlock.dcs.forEach(function(curDCofBlock){
					$rootScope.dataCenters.forEach(function(curInDC){
						if(curInDC._id == curDCofBlock){
							toReturn.push(curInDC.name);
						}
					});
				});
			}
			return toReturn.join(', ');
		};

		$scope.showBlockNodes = function(){
			var toReturn = [];
			if($scope.curBlock.nodes && $rootScope.nodes){
				$scope.curBlock.nodes.forEach(function(curDCofBlock){
					$rootScope.nodes.forEach(function(curInDC){
						if(curInDC._id == curDCofBlock){
							toReturn.push(curInDC.name);
						}
					});
				});
			}
			return toReturn.join(', ');
		};

		$scope.fetchIPBlocks = function(){
			$rootScope.ipblocks = $ipblock.query();
		};

		$scope.fetchNodes = function(){
			$rootScope.nodes = $node.query();
		};

		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchIPBlocks();
		$scope.fetchDCs();
		$scope.fetchNodes();

		$scope.fetchIPBlock = function(){
			$scope.curBlock = $ipblock.get({id:$stateParams.id}, function(result){
				//here fetch is done.
			});
		};

		if($stateParams.id){
			$scope.fetchIPBlock();
		}

		$scope.saveIPBlock = function(){
			$scope.curBlock.$update(function(result){
				$rootScope.ipblocks = $ipblock.query();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deleteIPBlock = function(){
			if(confirm("Are you sure you want to delete " + $scope.curBlock.name)){
				$scope.curBlock.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the IP block");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$state.go('r.dashboard.ipblocks');
						$scope.fetchNodes();
					}
				});
			}
		};

		$scope.addIPBlock = function(_name, _gateway, _netmask, _nameserver1, _nameserver2){
			if(!_name){ 						$scope.ipblocknewalert = "Name can't be empty"; 			return 0; }
			if(!_gateway){ 						$scope.ipblocknewalert = "Gateway can't be empty"; 			return 0; }
			if(!validIP4(_gateway)){ 			$scope.ipblocknewalert = "Gateway is invalid"; 				return 0; }
			if(!_netmask){						$scope.ipblocknewalert = "Netmask can't be empty";			return 0; }
			if(!validIP4(_netmask)){ 			$scope.ipblocknewalert = "Netmask is invalid"; 				return 0; }
			if(!_nameserver1){					$scope.ipblocknewalert = "Nameserver 1 can't be empty";		return 0; }
			if(!validIP4(_nameserver1)){		$scope.ipblocknewalert = "Nameserver 1 is invalid"; 		return 0; }
			if(!_nameserver2){					$scope.ipblocknewalert = "Nameserver 2 can't be empty";		return 0; }
			if(!validIP4(_nameserver2)){		$scope.ipblocknewalert = "Nameserver 2 is invalid"; 		return 0; }
			if(_nameserver1 == _nameserver2){	$scope.ipblocknewalert = "Nameservers can't be the same";	return 0; }
			var theNewIPBlock = new $ipblock;
			theNewIPBlock.name = _name;
			theNewIPBlock.gateway = _gateway;
			theNewIPBlock.netmask = _netmask;
			theNewIPBlock.nameserver1 = _nameserver1;
			theNewIPBlock.nameserver2 = _nameserver2;
			theNewIPBlock.dcs = [];
			$rootScope.dataCenters.forEach(function(curDC){
				if(curDC.checked){
					theNewIPBlock.dcs.push(curDC._id);
				}
			});
			theNewIPBlock.nodes = [];
			$rootScope.nodes.forEach(function(curNode){
				if(curNode.checked){
					theNewIPBlock.nodes.push(curNode._id);
				}
			});
			$scope.ipblocknewalert = '';
			$ipblock.save(theNewIPBlock, function(theResult){
				$scope.fetchIPBlocks();
				$state.go('r.dashboard.ipblocks');
			});

		};

		$scope.addIPBlockcancel = function(){
			$state.go('r.dashboard.ipblocks');
		};
	}
]);

cloudControllers.controller('nodeController', ['$scope', '$rootScope', '$node', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$modal', '$storage',
	function($scope, $rootScope, $node, $state, $stateParams, $localStorage, $datacenter, $http, $q, $modal, $storage){
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
			$scope.nbmodalInstance = $modal.open({
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
			$scope.modalInstance = $modal.open({
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

	}
]);

cloudControllers.controller('datacenterController', ['$scope', '$http', '$userService', '$rootScope', '$datacenter', '$state', '$stateParams', '$localStorage',
	function($scope, $http, $userService, $rootScope, $datacenter, $state, $stateParams, $localStorage) {
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

cloudControllers.controller('dashboardController', ['$scope', '$http', '$userService', '$rootScope', '$datacenter', '$state',
	function($scope, $http, $userService, $rootScope, $datacenter, $state) {
		$scope.managersGo = function(){
			$state.go("r.dashboard.managers");
		};

		$scope.datacentersGo = function(){
			$state.go("r.dashboard.datacenters");
		};

		$scope.nodesGo = function(){
			$state.go("r.dashboard.nodes");
		};

		$scope.plansGo = function(){
			$state.go("r.dashboard.plans");
		};

		$scope.serversGo = function(){
			$state.go("r.dashboard.servers");
		};

		$scope.imagesGo = function(){
			$state.go("r.dashboard.images");
		};

		$scope.isofilesGo = function(){
			$state.go("r.dashboard.isofiles");
		};

		$scope.ipblocksGo = function(){
			$state.go("r.dashboard.ipblocks");
		};

		$scope.storagesGo = function(){
			$state.go("r.dashboard.storages");
		};

		$scope.logsGo = function(){
			$state.go("r.dashboard.logs");
		};

		$scope.isCurFocus = function(toCheck){
			if($state.current.name.indexOf('.'+toCheck) >= 0){
				if(toCheck == 'dashboard'){
					if($state.current.name == 'r.dashboard'){
						return true;
					} else {
						return false;
					}
				} else {
					return true;
				}
			} else {
				return false;
			}
		};
/*
		$scope.fetchDCs = function(){
			$rootScope.dataCenters = $datacenter.query();
		};

		$scope.fetchDCs();
*/
		$.AdminLTE.layout.activate();
		$.AdminLTE.layout.fix();
		$.AdminLTE.layout.fixSidebar();
		$.AdminLTE.pushMenu.activate("[data-toggle='offcanvas']");

	}


]);

cloudControllers.controller('profileController', ['$scope', '$routeParams', function($scope, $routeParams) {
	console.log("profileController");
}]);

cloudControllers.controller('welcomeController', function($scope, $modal, $state, $http, $q, $userService) {

	$scope.openSignUpModal = function() {
		var instance = $modal.open({
			templateUrl: 'partials/authentication/signupModal.html',
			controller: 'signupModalController',
			controllerAs: 'signupModalController'
		});

		instance.result.then(
			function(result) {
				console.log("Result", result);
			},
			function(result) {
				console.log("Dismissed:", result);
			}
		);
	};

	$scope.openSignInModal = function(){
		$state.go('dashboard');
	};
});

cloudControllers.controller('signupModalController', function($scope, $userService) {
	this.cancel = $scope.$dismiss;
	this.submit = function(email, password) {
		console.log("Register", email, password);
		$scope.$close(1);
	};
});


cloudControllers.controller('signinModalController', function($scope, $userService) {

	this.cancel = $scope.$dismiss;
	this.submit = function(email, password) {
		$userService.signin(email, password).then(function(result) {
			$scope.$close(result);

		});
	};
});

cloudControllers.controller('signoutController', function($scope, $userService, $state) {
	$userService.signout().then(function(result) {
		$state.go('r.dashboard');
	});
});