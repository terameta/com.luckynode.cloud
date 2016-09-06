angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.ipblocks', {
			url:"/ipblocks",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/ipblock/ipblockList.html", controller: 'ipblockController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.ipblocknew', {
			url:"/ipblocknew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/ipblock/ipblockNew.html", controller: 'ipblockController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.ipblock', {
			url:"/ipblock/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/ipblock/ipblockDetail.html", controller: 'ipblockController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('$ipblock', ['$resource',
	function ipblockService($resource) {
		return ( $resource(
			'/api/ipblock/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('adminControllers').controller('ipblockController', ['$scope', '$rootScope', '$state', '$stateParams', '$ipblock', '$datacenter', '$node',
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
				console.log($scope.curBlock);
				$scope.curBlock.ips.forEach(function(curIP){
					curIP.orderer = curIP.ip.split(".");
					curIP.orderer[0] = ("000" + curIP.orderer[0]);		curIP.orderer[0] = curIP.orderer[0].substr(curIP.orderer[0].length -3);
					curIP.orderer[1] = ("000" + curIP.orderer[1]);		curIP.orderer[1] = curIP.orderer[1].substr(curIP.orderer[1].length -3);
					curIP.orderer[2] = ("000" + curIP.orderer[2]);		curIP.orderer[2] = curIP.orderer[2].substr(curIP.orderer[2].length -3);
					curIP.orderer[3] = ("000" + curIP.orderer[3]);		curIP.orderer[3] = curIP.orderer[3].substr(curIP.orderer[3].length -3);
					curIP.orderer = curIP.orderer.join(".");
					//console.log(curIP);
				});
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