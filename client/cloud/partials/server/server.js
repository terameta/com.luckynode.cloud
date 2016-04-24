angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.servers', {
			url: "/servers",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/server/serverList.html", controller: 'ctrlServer' }
			},
			data: { requireSignin: true }
		}).state('r.server', {
			url: "/server/:id",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/server/serverDetail.html", controller: 'ctrlServer' }
			},
			data: { requireSignin: true }
		}).state('r.newserver', {
			url:"/newserver",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/server/newServer.html", controller: 'ctrlServer' }
			}
		});
});

angular.module('cloudServices').service('srvcServer', ['$resource', '$rootScope', '$sce',
	function srvcEndUser($resource, $rootScope, $sce) {
		var service = {};

		service.resource = $resource( '/api/client/server/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchAll = function(){
			$rootScope.servers = service.resource.query();
		};

		service.fetchAll();

		service.fetchOne = function(id){
			return service.resource.get({id: id}, function(result){
				result.domstate = '';
			});
		};

		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlServer', ['$scope', '$http', '$q', '$rootScope', '$state', '$stateParams', '$uibModal', 'srvcDataCenter', 'srvcServer', 'srvcPlan', 'srvcImage', 'srvcLocations', 'srvcInfo', 'srvcImageGroup', 'srvcConfirm', 'srvcInvoice',
	function($scope, $http, $q, $rootScope, $state, $stateParams, $uibModal, srvcDataCenter, srvcServer, srvcPlan, srvcImage, srvcLocations, srvcInfo, srvcImageGroup, srvcConfirm, srvcInvoice) {

		var lnToastr = toastr;

		$scope.deleteServerByConfirm = function(id) {
			var theServertoDelete;

			$scope.servers.forEach(function(curSrv){
				if(curSrv._id == id) theServertoDelete = curSrv;
			});

			var modalOptions = {
				closeButtonText: 'Cancel',
				actionButtonText: 'Delete Server',
				headerText: 'Delete ' + theServertoDelete.name + '?',
				bodyText: 'Are you sure you want to delete this server?'
			};

			srvcConfirm.showModal({}, modalOptions).
				then(function success(result){
					lnToastr.info('Approved to Delete');
					$scope.servers.forEach(function(curSrv) {
						if(curSrv._id == id){
							theServertoDelete.$delete(function(result, error){
								console.log(result);
								if(result.status == "fail"){
									alert("There was an error deleting the storage");
									$state.go($state.current, {}, {reload: true});
								} else {
									//burada angular toaster kullanabiliriz.
									$state.go('r.servers');
									srvcServer.fetchAll();
								}
							});
						}
					});
				},function failure(issue){
					lnToastr.warning("You have cancelled the server delete. Nothing will be done.");
				});
		};

		if($stateParams.id){
			srvcServer.fetchOne($stateParams.id).$promise.then(function(result){
				$scope.curServer = result;
				$scope.curServer.domstate = '';
				$scope.serverState(true);
			});
		}

		$scope.serverConverged = function(curCommand, details){
			var deferred = $q.defer();
			if(!details) details = {id: $stateParams.id};
			$http.post(
				'/api/client/server/converged',
				{
					id: $stateParams.id,
					command: curCommand,
					details: details
				}
			).success(function(data, status, headers, config) {
				$scope.serverState();
				lnToastr.info( "Command "+ curCommand +" successfully completed");
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				lnToastr.error("Command "+ curCommand +" failed");
				deferred.reject(data);
			});
			return deferred.promise;
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
			if($scope.curServer._id && $state.current.name == 'r.server'){
				$http.get('/api/client/server/state/'+$stateParams.id).success(function(data, status, headers, config) {
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

		$scope.imageGroupTabs = [];

		$scope.formatDate = function(theDate){
			return moment(theDate).format("DD.MMM.YYYY, h:mm:ss A");
		};

		$rootScope.imagegroups.$promise.then(prepareImageGroupTabs);

		function prepareImageGroupTabs(){
			$scope.imagegroups.sort(function(a,b){
				return parseInt(a.order, 10) - parseInt(b.order, 10);
			});
			$rootScope.imagegroups.forEach(function(curGroup){
				$scope.imageGroupTabs.push({
					title: curGroup.name,
					id: curGroup._id
				});
			});
			$rootScope.images.$promise.then(prepareImageGroupTabsPost);
		}

		function prepareImageGroupTabsPost(){
			for(var i = $scope.imageGroupTabs.length-1; i >= 0 ; i--){
				var dowehave = false;
				$scope.images.forEach(function(curImage){
					if(curImage.group == $scope.imageGroupTabs[i].id) dowehave = true;
				});
				if(!dowehave) $scope.imageGroupTabs.splice(i,1);
			}
		}

		$scope.countries = srvcLocations.countries;
		$scope.operatingSystems = srvcInfo.operatingSystems;

		$scope.curNewServer = {
			cpu: 2,
			ram: 2,
			hdd: 20,
			ips: 1
		};

		$scope.planChanged = function(){
			$scope.plans.forEach(function(curPlan){
				if(curPlan._id == $scope.curNewServer.plan){
					$scope.curNewServer.bandwidth = curPlan.bandwidth;
					$scope.curNewServer.cpu = curPlan.cpu;
					$scope.curNewServer.hdd = curPlan.hdd;
					$scope.curNewServer.ram = curPlan.ram;
				}
			});
			$scope.checkOrderValidity();
		};

		$scope.orderImageChanged = function(){
			$scope.images.forEach(function(curImage){
				if(curImage._id == $scope.curNewServer.img){
					$scope.curNewServer.requirements = curImage.requirements;
				}
			});
			$scope.checkOrderValidity();
		};

		$scope.checkOrderValidity = function(){
			console.log("We are at checkOrderValidity");
			console.log($scope.curNewServer.requirements);
			console.log($scope.curNewServer.cpu);
			console.log($scope.curNewServer.ram);
			console.log($scope.curNewServer.hdd);
			console.log("AT A");
			if(!$scope.curNewServer.plan) return false;
			console.log("AT B");
			if(!$scope.curNewServer.img) return false;
			console.log("AT C");
			if(!$scope.curNewServer.requirements){ 											$scope.curNewServer.issue = 'No image requirements defined'; return false; }
			console.log("AT D");
			if($scope.curNewServer.cpu < $scope.curNewServer.requirements.cpu){		$scope.curNewServer.issue = 'Not enough CPU cores on the selected plan'; return false; }
			console.log("AT E");
			if($scope.curNewServer.ram < $scope.curNewServer.requirements.ram){		$scope.curNewServer.issue = 'Not enough memory on the selected plan'; return false; }
			console.log("AT F");
			if($scope.curNewServer.hdd < $scope.curNewServer.requirements.hdd){		$scope.curNewServer.issue = 'Not enough disk space on the selected plan'; return false; }
			console.log("AT G");
			return true;
		};

		$scope.orderServer = function(){
			$scope.nbmodalInstance = $uibModal.open({
				animation: true,
				templateUrl: "/cloud/partials/server/serverOrderModal.html",
				size: 'lg',
				scope: $scope
			});
		};

		$scope.orderActionAlert = '';

		$scope.orderAction = function(){
			console.log("We are at order action");
			if(!$scope.curNewServer.name){ 	$scope.orderActionAlert = 'Please provide a name for your new server.'; 		return 0; }
			if(!$scope.curNewServer.plan){ 	$scope.orderActionAlert = 'Please choose a plan for your new server.'; 			return 0; }
			if(!$scope.curNewServer.img){ 	$scope.orderActionAlert = 'Please choose a image for your new server.'; 		return 0; }
			if(!$scope.curNewServer.dc){ 		$scope.orderActionAlert = 'Please choose a datacenter for your new server.'; 	return 0; }
			$scope.curNewServer.issue = '';
			if(!$scope.checkOrderValidity()){ 	$scope.orderActionAlert = $scope.curNewServer.issue; 									return 0; }
			$scope.orderActionAlert = '';

			srvcServer.resource.save($scope.curNewServer, function success(theResult){
				console.log(theResult);
				//$scope.fetchServers();
				srvcServer.fetchAll();
				srvcInvoice.fetchAll();
				//$state.go('r.servers');
				//$state.go($state.current, {}, {reload: true});
				$state.go('r.server', {id:theResult._id});
			}, function failure(issue){
				lnToastr.error("Server creation failed.<br />Error message:<br />" + issue.data.message);
			});
		};

		$scope.orderCancel = function(){
			$scope.nbmodalInstance.dismiss();
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
			$http.get('/api/client/server/startConsoleOnTheServer/'+$scope.curServer._id).success(function(data, status, headers, config) {
				deferred.resolve(data);
			}).error(function(data, status, headers, config) {
				deferred.reject(data);
			});
			return deferred.promise;
		};

		$scope.startConsoleCanvas = function(thePort){
			/*console.log("We are loading scripts");
			Util.load_scripts(["webutil.js", "base64.js", "websock.js", "des.js",
				"keysymdef.js", "keyboard.js", "input.js", "display.js",
				"jsunzip.js", "rfb.js", "keysym.js"
			]);*/
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
				$scope.rfb.connect(host, thePort, $scope.curServer._id, path);
			};
		};

		$scope.openAttachISOModal = function(theTarget){
			console.log("Opening attach iso modal screen");
			$scope.curServerAvailableISOList = [];
			$scope.curISOAttachTarget = theTarget;
			$http.get('/api/client/server/getAvailableISOfiles/' + $scope.curServer._id).success(function(data, status, headers, config){
				$scope.curServerAvailableISOList = data;
				console.log(data);
			}).error(function(data, status, headers, config){
				console.log(data);
			});
			$scope.attachISOmodalInstance = $uibModal.open({
				animation: true,
				templateUrl: "/common/server/serverAttachIsoModal.html",
				size: 'lg',
				scope: $scope
			});

			$scope.attachISOmodalInstance.result.then(function(result){
				console.log("Result:", result);
			}, function(issue){
				if(issue && issue != 'backdrop click')	console.log("Issue:", issue);
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
			$scope.serverConverged('ejectISO', {target: ISOtarget, server: $scope.curServer._id}).then(function success(result){
				$scope.fetchCurServerDisks();
			}, function(issue) {
				lnToastr.error("Failed to eject disk");
				console.log(issue);
			});
		};
	}
]);