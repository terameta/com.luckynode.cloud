angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.servers', {
			url:"/servers",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/server/serverList.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.servernew', {
			url:"/servernew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/server/serverNew.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.server', {
			url:"/server/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/server/serverDetail.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('$server', ['$resource',
	function serverService($resource) {
		return ( $resource(
			'/api/server/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('adminControllers').controller('serverController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', '$ipblock', '$node', '$image', '$uibModal', '$http', '$q', 'srvcImageGroup', 'srvcUsers',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, $ipblock, $node, $image, $uibModal, $http, $q, srvcImageGroup, srvcUsers){

		$scope.activeServerDetailTab = 0;

		$scope.imageDiskDrivers = [{ value:'virtio', text: 'virtio' }, { value:'ide', text: 'ide'}];
		$scope.imageNetDrivers = [{value:'virtio', text: 'virtio'}, {value:'rtl8139', text: 'Realtek 8139'}, {value:'e1000', text: 'Intel PRO/1000'}];

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
			if(fromState.name == 'r.dashboard.server'){
				if($scope.rfb){
					$scope.rfb.disconnect();
				}
			}
		});

		$scope.fetchPlans = function(){
			$rootScope.plans = $plan.query();
		};

		$scope.fetchPlans();

		var lnToastr = toastr;

		$scope.curISOAttachTarget = '';

		$scope.consoleStatus = 'waiting';
		$scope.consoleStatusClass = 'label-warning';
		$scope.shouldShowConsole = false;
		$scope.shouldShowKeyboard = false;
		$scope.rfb = '';

		$scope.toggleCtrl = function() {
			if ($scope.consoleKeyboardObj.ctrlOn === false) {
				$scope.rfb.sendKey(XK_Control_L, true);
				//$D('toggleCtrlButton').className = "noVNC_status_button_selected";
				$scope.consoleKeyboardObj.ctrlOn = true;
			} else if ($scope.consoleKeyboardObj.ctrlOn === true) {
				$scope.rfb.sendKey(XK_Control_L, false);
				//$D('toggleCtrlButton').className = "noVNC_status_button";
				$scope.consoleKeyboardObj.ctrlOn = false;
			}
		};

		$scope.toggleAlt = function() {
				if($scope.consoleKeyboardObj.altOn === false) {
					 $scope.rfb.sendKey(XK_Alt_L, true);
					 //$D('toggleAltButton').className = "noVNC_status_button_selected";
					 $scope.consoleKeyboardObj.altOn = true;
				} else if($scope.consoleKeyboardObj.altOn === true) {
					 $scope.rfb.sendKey(XK_Alt_L, false);
					 //$D('toggleAltButton').className = "noVNC_status_button";
					 $scope.consoleKeyboardObj.altOn = false;
				}
		  };

		$scope.sendEsc = function() {
				//UI.keepKeyboard();
				$scope.rfb.sendKey(XK_Escape);
		  };

		  $scope.sendWin = function(){
			/*$scope.toggleCtrl();
			$scope.sendEsc();
			$scope.toggleCtrl();*/
			$scope.rfb.sendKey(XK_Super_L);
		  };

		  $scope.sendF1 	= function(){	$scope.rfb.sendKey(XK_F1) };
		  $scope.sendF2 	= function(){	$scope.rfb.sendKey(XK_F2) };
		  $scope.sendF3 	= function(){	$scope.rfb.sendKey(XK_F3) };
		  $scope.sendF4 	= function(){	$scope.rfb.sendKey(XK_F4) };
		  $scope.sendF5 	= function(){	$scope.rfb.sendKey(XK_F5) };
		  $scope.sendF6 	= function(){	$scope.rfb.sendKey(XK_F6) };
		  $scope.sendF7 	= function(){	$scope.rfb.sendKey(XK_F7) };
		  $scope.sendF8 	= function(){	$scope.rfb.sendKey(XK_F8) };
		  $scope.sendF9 	= function(){	$scope.rfb.sendKey(XK_F9) };
		  $scope.sendF10 	= function(){	$scope.rfb.sendKey(XK_F10) };
		  $scope.sendF11 	= function(){	$scope.rfb.sendKey(XK_F11) };
		  $scope.sendF12 	= function(){	$scope.rfb.sendKey(XK_F12) };

		$scope.consoleKeyboardObj = {
			ctrlOn: false,
			altOn: false
		};

		$scope.showKeyboard = function(){
			$scope.shouldShowKeyboard = true;
		};

		$scope.hideKeyboard = function(){
			$scope.shouldShowKeyboard = false;
		};

		$scope.consoleTabSelected = function(){
			$scope.startConsole();
			$scope.activeServerDetailTab = 1;
		};

		$scope.consoleTabDeselected = function(){
			$scope.stopConsole();
		};

		$scope.toggleConsole = function(){
			if($scope.shouldShowConsole == true){
				$scope.stopConsole();
			} else {
				$scope.startConsole();
			}
		};

		$scope.connectionDetailsTabSelected = function(){
			$scope.connectionInformation = "We are placing it here";
			$scope.images.forEach(function(curImage){
				if(curImage._id == $scope.curServer.image) $scope.connectionInformation = curImage.connectionInformation;
			});
			if(!$scope.connectionInformation) $scope.connectionInformation = "";
			$scope.connectionInformation = $scope.connectionInformation.replace(/__serverip__/g,$scope.curServer.ip);
			if($scope.curServer.storedPassword){
				$scope.connectionInformation = $scope.connectionInformation.replace(/__storedPassword__/g,$scope.curServer.storedPassword);
			} else {
				$scope.connectionInformation = $scope.connectionInformation.replace(/__storedPassword__/g,"Your server's new password is not defined yet. This might take about 15 to 20 minutes after creation, please refresh the page to check the password.");
			}

			$scope.connectionInformation = $scope.connectionInformation.replace(/\n/g,"<br>");
		};

		$scope.stopConsole = function(){
			console.log("We are stopping console");
			//console.log($scope.rfb);
			if($scope.shouldShowConsole){
				$scope.rfb.disconnect();
				$scope.rfb = '';
				$scope.shouldShowConsole = false;
			}
			if($scope.activeServerDetailTab == 1){
				$scope.activeServerDetailTab == 0;
			}
		};

		$scope.startConsole = function(){
			$scope.shouldShowConsole = true;

			$scope.startConsoleOnTheServer().then(
				function(result){
					console.log(result, "---");
					$scope.startConsoleCanvas(result.port);
				},
				function(issue){
					$scope.consoleStatus = 'Error while initiating the console server<br>Details:'+issue.detail;
					$scope.consoleStatusClass = 'label-danger';
				}
			);
		};

		$scope.startConsoleOnTheServer = function(){
			$scope.consoleStatus = 'Initiating the console server';
			var deferred = $q.defer();
			$http.get('/api/server/startConsoleOnTheServer/'+$scope.curServer._id).success(function(data, status, headers, config) {
				deferred.resolve(data);
				//console.log("We are here before loading scripts");
			}).error(function(data, status, headers, config) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		$scope.startConsoleCanvas = function(thePort){
			//console.log("We are loading scripts ---");
			Util.load_scripts([
				"../../lib/no-vnc/include/webutil.js",
				"../../lib/no-vnc/include/base64.js",
				"../../lib/no-vnc/include/websock.js",
				"../../lib/no-vnc/include/des.js",
				"../../lib/no-vnc/include/keysymdef.js",
				"../../lib/no-vnc/include/keyboard.js",
				"../../lib/no-vnc/include/input.js",
				"../../lib/no-vnc/include/display.js",
				"../../lib/no-vnc/include/jsunzip.js",
				"../../lib/no-vnc/include/rfb.js",
				"../../lib/no-vnc/include/keysym.js"
			]);
			//console.log("We areeeeee heeeeererere");

			//var rfb;

			$scope.sendCtrlAltDel = function() {
				$scope.rfb.sendCtrlAltDel();
				return false;
			};

			function updateState(rfb, state, oldstate, msg) {
				switch (state) {
					case 'failed':						$scope.consoleStatusClass = 'label-danger';					break;
					case 'fatal':						$scope.consoleStatusClass = 'label-danger';					break;
					case 'normal':						$scope.consoleStatusClass = 'label-success';				break;
					case 'disconnected':				$scope.consoleStatusClass = 'label-success';				break;
					case 'loaded':						$scope.consoleStatusClass = 'label-success';				break;
					default:							$scope.consoleStatusClass = 'label-warning';				break;
				}

				if (state !== "normal") {
					$scope.CtrlAltDelButtonDisabled = true;
					//xvpInit(0); //we are not using this function for now
				} else {
					$scope.CtrlAltDelButtonDisabled = false;
				}

				if (typeof(msg) !== 'undefined') {
					$scope.consoleStatus = rfb._rfb_state + ':' + msg.toString();
					if (!$scope.$$phase) {
						$scope.$apply();
					}

				}
			}

			window.onscriptsload = function() {
				var host, port, password, path, token;
				//console.log("Scripts are now loaded");

				WebUtil.init_logging(WebUtil.getQueryVar('logging', 'error'));
				//document.title = unescape(WebUtil.getQueryVar('title', 'noVNC'));
				// By default, use the host and port of server that served this file
				host = WebUtil.getQueryVar('host', window.location.hostname);
				port = WebUtil.getQueryVar('port', window.location.port);

				// if port == 80 (or 443) then it won't be present and should be
				// set manually
				if (!port) {
					if (window.location.protocol.substring(0, 5) == 'https') {
						port = 443;
					}
					else if (window.location.protocol.substring(0, 4) == 'http') {
						port = 80;
					}
				}

				// If a token variable is passed in, set the parameter in a cookie.
				// This is used by nova-novncproxy.
				token = WebUtil.getQueryVar('token', null);
				if (token) {
					WebUtil.createCookie('token', token, 1)
				}

				password = WebUtil.getQueryVar('password', '');
				//console.log("Password:", password);
				path = WebUtil.getQueryVar('path', 'websockify');
				//console.log("Path:",path);

				if ((!host) || (!port)) {
					updateState('failed',
						"Must specify host and port in URL");
					return;
				}

				$scope.rfb = new RFB({
					'target': $D('noVNC_canvas'),
					'encrypt': WebUtil.getQueryVar('encrypt', (window.location.protocol === "https:")),
					'repeaterID': WebUtil.getQueryVar('repeaterID', ''),
					'true_color': WebUtil.getQueryVar('true_color', true),
					'local_cursor': WebUtil.getQueryVar('cursor', true),
					'shared': WebUtil.getQueryVar('shared', true),
					'view_only': WebUtil.getQueryVar('view_only', false),
					'onUpdateState': updateState
					//'onXvpInit': xvpInit,
					//'onPasswordRequired': passwordRequired
				});
				//rfb.connect(host, port, password, path);
				$scope.rfb.connect(host, thePort, $scope.curServer._id, path);
			};
		};

		$scope.basenewserver = {
			_dc: 				'',
			_node: 			'',
			_image: 			'',
			_netdriver: 	'virtio',
			_diskdriver:  	'virtio'
		};

		$scope.newserver = $scope.basenewserver;

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
		};

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
			//console.log(item);
			if(item.reserved){
				return false;
			} else if(!$scope.newserver){
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
					if(!curIPB.ips) curIPB.ips = [];
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
				$scope.curServer.domstate = '';
				$scope.serverState(true);
			});
		};

		$scope.fetchCurServerDisks = function(){
			$scope.serverConverged('diskList').then(function success(result){
				$scope.curServer.diskList = result;
			}, function failure(issue){
				lnToastr.error("Error fetching list of disks");
			});
		};

		var isCheckingStateRegularly = false;
		var curServerInterval = '';

		$scope.serverState = function(shouldRepeat){
			if($scope.curServer._id && $state.current.name == 'r.dashboard.server'){
				$http.get('/api/server/serverState/'+$stateParams.id).success(function(data, status, headers, config) {
					$scope.curServer.domstate = data.domstate;
					if(!isCheckingStateRegularly && shouldRepeat){
						curServerInterval = setInterval(function(){ $scope.serverState() }, 15000);
					}
				}).error(function(data, status, headers, config) {
					lnToastr.error("We couldn't get the server state! Details");
				});
				if(!$scope.curServer.diskList){
					$scope.fetchCurServerDisks();
				}
			} else {
				clearInterval(curServerInterval);
			}
		};

		$scope.serverConverged = function(curCommand, details){
			var deferred = $q.defer();
			if(!details) details = {id: $stateParams.id};
			$http.post(
				'/api/server/converged',
				{
					id: $stateParams.id,
					command: curCommand,
					details: details
				}
			).success(function(data, status, headers, config) {
				$scope.serverState();
				lnToastr.info( "Command "+ curCommand +" successfully completed");
				console.log(data);
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				lnToastr.error("Command "+ curCommand +" failed");
				deferred.reject(data);
			});
			return deferred.promise;
		};

		$scope.initiateMigration = function(targetNode){
			$scope.curServer.migrating = true;
			lnToastr.info("Initiating migration");
			lnToastr.info("Source Node:"+$scope.curServer.node);
			lnToastr.info("Target Node:"+targetNode);
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
			$scope.newserver._bandwidth = thePlan.bandwidth;
		};

		$scope.addServer = function(){
			//console.log($scope.newserver);
			if(!$scope.newserver._name){ 							$scope.servernewalert = "Name can't be empty";										return 0;   }
			if(!$scope.newserver._cpu){ 							$scope.servernewalert = "Number of CPU cores can't be empty";					return 0;   }
			if(!isInteger($scope.newserver._cpu)){ 			$scope.servernewalert = "Number of CPU cores should be a whole number";		return 0;   }
			if(!$scope.newserver._hdd){ 							$scope.servernewalert = "HDD size can't be empty";									return 0;   }
			if(!isInteger($scope.newserver._hdd)){ 			$scope.servernewalert = "HDD size should be a whole number";					return 0;   }
			if(!$scope.newserver._ram){ 							$scope.servernewalert = "RAM size can't be empty";									return 0;   }
			if(!isInteger($scope.newserver._ram)){ 			$scope.servernewalert = "RAM size should be a whole number";					return 0;   }
			if(!$scope.newserver._bandwidth){ 					$scope.servernewalert = "Bandwidth can't be empty";								return 0;   }
			if(!isInteger($scope.newserver._bandwidth)){ 	$scope.servernewalert = "Bandwidth should be a whole number";					return 0;   }
			if(!$scope.newserver._dc){    						$scope.servernewalert = "Please select a datacenter";								return 0;   }
			if(!$scope.newserver._image){
				if(!$scope.newserver._netdriver){				$scope.servernewalert = "Please select a disk type";								return 0;   }
				if(!$scope.newserver._diskdriver){				$scope.servernewalert = "Please select a network card driver";					return 0;   }
			}

			var theNewServer = {};
			theNewServer.name		= $scope.newserver._name;
			theNewServer.cpu		= $scope.newserver._cpu;
			theNewServer.hdd		= $scope.newserver._hdd;
			theNewServer.ram		= $scope.newserver._ram;
			theNewServer.bandwidth	= $scope.newserver._bandwidth;
			theNewServer.dc			= $scope.newserver._dc;
			theNewServer.node			= (($scope.newserver._node) 	? $scope.newserver._node._id 	: 'AUTO');
			theNewServer.ip			= (($scope.newserver._ip) 		? $scope.newserver._ip.ip		: 'AUTO');
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
				//$state.go('r.dashboard.servers');
				$scope.newserver = $scope.basenewserver;
				$state.go('r.dashboard.server', { id: theResult._id });
			});
		};

		$scope.saveServer = function(){
			lnToastr.info("Saving server");
			$scope.curServer.$update(function(result){
				lnToastr.success("Server is saved");
				$scope.fetchServers();
				$scope.fetchCurServer();
			}, function(error){
				lnToastr.error("Server save failed<br>"+error);
				//console.log(error);
			});
		};

		$scope.deleteServer = function(){
			if(confirm("Are you sure you want to delete " + $scope.curServer.name)){
				$scope.curServer.$delete(function(result, error){
					//console.log(result);
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
			$scope.attachISOmodalInstance = $uibModal.open({
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

		$scope.attachISO = function(curISO){
			var commandData = {
				iso: curISO.file,
				pool: curISO.pool,
				server: $scope.curServer._id,
				target: $scope.curISOAttachTarget
			};
			$scope.serverConverged('attachISO', commandData).then(function success(result){
				$scope.closeAttachISOModal();
				$scope.fetchCurServerDisks();
			},function(issue) {
				lnToastr.error("Attaching the ISO has failed");
				console.log(issue);
			});
		};

		$scope.ejectISO = function(ISOtarget){
			console.log(ISOtarget);
			$scope.serverConverged('ejectISO', {target: ISOtarget, server: $scope.curServer._id}).then(function success(result){
				$scope.fetchCurServerDisks();
			}, function(issue) {
				lnToastr.error("Failed to eject disk");
				console.log(issue);
			});
		};

		$scope.serverResize = function(){
			lnToastr.info("Starting resize");
			$http.get('/api/server/serverResize/'+$stateParams.id).success(function(data, status, headers, config) {
				console.log("Success:", data);
				$scope.serverState();
			}).error(function(data, status, headers, config) {
				console.log("Error:", data);
			});
		};
	}
]);