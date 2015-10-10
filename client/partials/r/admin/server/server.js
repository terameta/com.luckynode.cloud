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

angular.module('cloudControllers').controller('serverController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', '$ipblock', '$node', '$image', '$modal', '$http', '$q',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, $ipblock, $node, $image, $modal, $http, $q){
		$scope.imageDiskDrivers = [{ value:'virtio', text: 'virtio' }, { value:'ide', text: 'ide'}];
		$scope.imageNetDrivers = [{value:'virtio', text: 'virtio'}, {value:'rtl8139', text: 'Realtek 8139'}, {value:'e1000', text: 'Intel PRO/1000'}];

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
			if(fromState.name == 'r.dashboard.server'){
				if($scope.rfb){
					$scope.rfb.disconnect();
				}
			}
		});

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

		$scope.toggleConsole = function(){
			if($scope.shouldShowConsole == true){
				$scope.stopConsole();
			} else {
				$scope.startConsole();
			}
		};

		$scope.stopConsole = function(){
			//console.log("We are stopping console");
			//console.log($scope.rfb);
			$scope.rfb.disconnect();
			$scope.rfb = '';
			$scope.shouldShowConsole = false;
		};

		$scope.startConsole = function(){
			$scope.shouldShowConsole = true;

			$scope.startConsoleOnTheServer().then(
				function(result){
					//console.log(result);
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
			}).error(function(data, status, headers, config) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		$scope.startConsoleCanvas = function(thePort){
			//console.log("We are loading scripts");
			Util.load_scripts(["webutil.js", "base64.js", "websock.js", "des.js",
				"keysymdef.js", "keyboard.js", "input.js", "display.js",
				"jsunzip.js", "rfb.js", "keysym.js"
			]);

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
			$http.get('/api/server/listAttachedDisks/'+$stateParams.id).success(function(data, status, headers, config) {
				//console.log("Success:", data);
				$scope.curServer.diskList = data;
			}).error(function(data, status, headers, config) {
				console.log("Error:", data);
			});
		};

		$scope.serverStart = function(){
			lnToastr.info("Server is starting");
			$http.get('/api/server/serverStart/'+$stateParams.id).success(function(data, status, headers, config) {
				lnToastr.success('Have fun with the server');
				$scope.serverState();
			}).error(function(data, status, headers, config) {
				lnToastr.error('Server start failed! Details:<br>'+data);
			});
		};

		var isCheckingStateRegularly = false;
		var curServerInterval = '';

		$scope.serverState = function(shouldRepeat){
			if($scope.curServer._id && $state.current.name == 'r.dashboard.server'){
				$http.get('/api/server/serverState/'+$stateParams.id).success(function(data, status, headers, config) {
					$scope.curServer.domstate = data;
					if(!isCheckingStateRegularly && shouldRepeat){
						curServerInterval = setInterval(function(){ $scope.serverState() }, 15000);
					}
				}).error(function(data, status, headers, config) {
					lnToastr.error("We couldn't get the server state! Details:<br>"+data);
				});
				if(!$scope.curServer.diskList){
					$scope.fetchCurServerDisks();
				}
			} else {
				clearInterval(curServerInterval);
			}
		};

		$scope.serverShutDown = function(){
			$http.get('/api/server/serverShutDown/'+$stateParams.id).success(function(data, status, headers, config) {
				console.log("Success:", data);
				$scope.serverState();
			}).error(function(data, status, headers, config) {
				console.log("Error:", data);
			});
		};

		$scope.serverReboot = function(){
			$http.get('/api/server/serverReboot/'+$stateParams.id).success(function(data, status, headers, config) {
				lnToastr.info("Server restart is in progress");
				$scope.serverState();
			}).error(function(data, status, headers, config) {
				lnToastr.error("Server restart failed<br />"+data);
			});
		};

		$scope.serverPowerOff = function(){
			$http.get('/api/server/serverPowerOff/'+$stateParams.id).success(function(data, status, headers, config) {
				console.log("Success:", data);
				$scope.serverState();
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
				//$state.go('r.dashboard.servers');
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