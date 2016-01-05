angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.images', {
			url:"/images",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/image/imageList.html", controller: 'imageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.imagenew', {
			url:"/imagenew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/image/imageNew.html", controller: 'imageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.imagenewfromdisk', {
			url:"/imagenewfromdisk",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/image/imageNewFromDisk.html", controller: 'imageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.image', {
			url:"/image/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/image/imageDetail.html", controller: 'imageController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('$image', ['$resource',
	function serverService($resource) {
		return ( $resource(
			'/api/image/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('imageController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', '$image', '$storage', 'srvcImageGroup', '$http',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, $image, $storage, srvcImageGroup,$http){
		srvcImageGroup.fetchAll();

		$scope.newImage = {
			_status: "enabled",
			_architecture: "x86_64",
			_netdriver: "virtio",
			_diskdriver: "virtio"
		};

		var lnToastr = toastr;

		$scope.imageStatuses = [ { value: 'enabled', text: 'Enabled'}, { value: 'disabled', text: 'Disabled'}];
		$scope.imageArchitectures = [{value:'x86_64', text: 'x86_64'}, {value:'i386', text: 'i386'}];
		$scope.imageDiskDrivers = [{ value:'virtio', text: 'virtio' }, { value:'ide', text: 'ide'}];
		$scope.imageNetDrivers = [{value:'virtio', text: 'virtio'}, {value:'rtl8139', text: 'Realtek 8139'}, {value:'e1000', text: 'Intel PRO/1000'}];
		$scope.imageDiskTypes = [{ value:'qcow2', text: 'QCoW2' }, { value:'raw', text: 'Raw'}, { value:'ceph', text: 'Ceph'}];
		$scope.imageOSList = [
			{ value: 'centos-icon',			text: 'Centos',			type: 'Linux'},
			{ value: 'debian',				text: 'Debian',			type: 'Linux'},
			{ value: 'exherbo',				text: 'Exherbo',		type: 'Linux'},
			{ value: 'fedora',				text: 'Fedora',			type: 'Linux'},
			{ value: 'freebsd',				text: 'FreeBSD',		type: 'BSD'},
			{ value: 'gentoo',				text: 'Gentoo',			type: 'Linux'},
			{ value: 'linux-mint',			text: 'Mint',			type: 'Linux'},
			{ value: 'macosx',				text: 'OS X',			type: 'Apple'},
			{ value: 'redhat',				text: 'RedHat',			type: 'Linux'},
			{ value: 'solaris',				text: 'Solaris',		type: 'Unix'},
			{ value: 'suse',				text: 'Suse',			type: 'Linux'},
			{ value: 'ubuntu',				text: 'Ubuntu',			type: 'Linux'},
			{ value: 'microsoft-windows',	text: 'Windows',		type: 'Windows'}
		];

		$scope.fetchImages = function(){
			$rootScope.images = $image.query();
		};

		$scope.fetchStorages = function(){
			$rootScope.storages = $storage.query();
		};

		$scope.fetchServers = function(){
			$rootScope.servers = $server.query();
		};

		$scope.fetchImages();
		$scope.fetchStorages();
		$scope.fetchServers();

		$scope.curCreationPercentage = 0;

		$scope.fetchCurImage = function(){
			$scope.curImage = $image.get({id: $stateParams.id}, function(result){
				//here fetch is done.
				$scope.appSort();
				$scope.curCreationPercentage = parseInt($scope.curImage.status, 10);
				if($scope.curCreationPercentage){
					setTimeout(function(){ $scope.fetchCurImage(); }, 10000);
				} else {
					console.log($scope.curCreationPercentage);
				}
			});
		};

		if($stateParams.id){
			$scope.fetchCurImage();
		}


		$scope.addImage = function(){
			if(!$scope.newImage._name){ 					$scope.imagenewalert = "Name can't be empty";							return 0;   }
			if(!$scope.newImage._pool){ 					$scope.imagenewalert = "Please select a pool";							return 0;   }
			if(!$scope.newImage._basefile){					$scope.imagenewalert = "Please enter base file name";					return 0;   }
			if(!$scope.newImage._status){					$scope.imagenewalert = "Please select a status";						return 0;   }
			if(!$scope.newImage._architecture){				$scope.imagenewalert = "Please select an architecture";					return 0;   }
			if(!$scope.newImage._diskdriver){				$scope.imagenewalert = "Please select a disk driver";					return 0;   }
			if(!$scope.newImage._netdriver){				$scope.imagenewalert = "Please select a network driver";				return 0;   }
			if(!$scope.newImage._imagetype){				$scope.imagenewalert = "Please select an image type";					return 0;   }

			var theNewImage 			= {};
			theNewImage.name 			= $scope.newImage._name;
			theNewImage.description 	= $scope.newImage._description;
			theNewImage.pool 			= $scope.newImage._pool._id;
			theNewImage.basefile		= $scope.newImage._basefile;
			theNewImage.status 			= $scope.newImage._status;
			theNewImage.architecture	= $scope.newImage._architecture;
			theNewImage.diskdriver		= $scope.newImage._diskdriver;
			theNewImage.netdriver 		= $scope.newImage._netdriver;
			theNewImage.imagetype		= $scope.newImage._imagetype;

			$scope.imagenewalert = '';
			//console.log("We are ready to deploy");
			//console.log(theNewImage);

			$image.save(theNewImage, function(theResult){
			//	console.log(theResult);
				$scope.fetchImages();
				$state.go('r.dashboard.images');
			});
		};

		$scope.saveImage = function(){
			$scope.curImage.$update(function(result){
				$scope.fetchImages();
				$scope.fetchCurImage();
			}, function(error){
				console.log(error);
			});
		};

		$scope.deleteImage = function(){
			if(confirm("Are you sure you want to delete " + $scope.curImage.name)){
				$scope.curImage.erasefile = confirm("Do you want the base file to be erased as well?");

				$scope.curImage.$delete({shouldErase: $scope.curImage.erasefile}, function(result, error){
					if(result.status == "fail"){
						lnToastr.error("There was an error deleting the image");
					} else {
						lnToastr.info("Image is deleted successfully");
						$scope.fetchImages();
						$state.go('r.dashboard.images');
					}
				}, function(error){
					lnToastr.error("We couldn't delete the image");
				});
			}
		};

		$scope.cancelImageAdd = function(){
			$state.go('r.dashboard.images');
		};

		$scope.imageTypeLocked = false;
		$scope.imageDiskTypeLocked = false;
		$scope.imageNetTypeLocked = false;

		$scope.imageFromDiskPoolChange = function(){
			//$scope.newImage._diskdriver = $scope.newImage._baseserver.diskdriver;
			//$scope.newImage._netdriver 	= $scope.newImage._baseserver.netdriver;
			$scope.fetchCurStorage();
			if($scope.newImage._pool.type == 'ceph'){
				$scope.imageTypeLocked = true;
				$scope.newImage._imagetype = 'ceph';
			} else {
				$scope.imageTypeLocked = false;
			}
		};

		$scope.imageFromDiskDiskChange = function(){
			console.log($scope.newImage._disk);
			if($scope.newImage._disk.server){
				$scope.imageDiskTypeLocked = true;
				$scope.imageNetTypeLocked = true;
				$scope.newImage._diskdriver = $scope.newImage._disk.server.diskdriver;
				$scope.newImage._netdriver = $scope.newImage._disk.server.netdriver;
			} else {
				$scope.imageDiskTypeLocked = false;
				$scope.imageNetTypeLocked = false;
			}
		};

		$scope.fetchCurStorage = function(){
			var poolID = $scope.newImage._pool._id;
			$scope.curStorage = $storage.get({id:poolID}, function(result){
				$http.post('/api/storage/converged/', { id: poolID, command: 'getFiles' }).
				success(function(data, status, headers, config) {
					$scope.curStorage.disks = data;
					$scope.curStorage.disks.forEach(function(curDisk){
						curDisk.isValid = false;
						var dash1 = curDisk.Name.indexOf('-')+1;
						var dash2 = curDisk.Name.indexOf('-',dash1);
						var curID = curDisk.Name.substring(dash1,dash2);
						if(curID.length == 24){
							curDisk.label = curID;
							$scope.servers.forEach(function(cSrv){
								if(curID == cSrv._id){
									curDisk.isValid = true;
									curDisk.label = curDisk.Name +' (Server: ' + cSrv.name +')';
									curDisk.server = cSrv;
								}
							});
							$scope.images.forEach(function(cImage){
								if(curID == cImage._id){
									curDisk.isValid = true;
									curDisk.label = curDisk.Name +' (Image: ' + cImage.name +')';
									curDisk.image = cImage;
								}
							});
						}
					});
				}).
				error(function(data, status, headers, config) {
					console.log(data);
					lnToastr.error("Can't receive files in storage");
				});
			});
		};

		$scope.addImageFromDisk = function(){
			if(!$scope.newImage._name){ 					$scope.imagenewalert = "Name can't be empty";							return 0;   }
			if(!$scope.newImage._pool){					$scope.imagenewalert = "Please select a base pool";					return 0;   }
			if(!$scope.newImage._disk){					$scope.imagenewalert = "Please select a base disk";					return 0;   }
			if(!$scope.newImage._imagetype){				$scope.imagenewalert = "Please select an image type";					return 0;   }
			if(!$scope.newImage._architecture){			$scope.imagenewalert = "Please select an architecture";				return 0;   }
			if(!$scope.newImage._diskdriver){			$scope.imagenewalert = "Please select a disk driver";					return 0;   }
			if(!$scope.newImage._netdriver){				$scope.imagenewalert = "Please select a network driver";				return 0;   }
			if(!$scope.newImage._targetpool){			$scope.imagenewalert = "Please select a target pool";					return 0;   }

			var theNewImage 				= {};
			theNewImage.name 				= $scope.newImage._name;
			theNewImage.description 	= $scope.newImage._description;
			theNewImage.basePool			= $scope.newImage._pool;
			theNewImage.baseDisk			= $scope.newImage._disk;
			theNewImage.baseServer		= $scope.newImage._disk.server;
			theNewImage.baseImage		= $scope.newImage._disk.image;
			theNewImage.imagetype		= $scope.newImage._imagetype;
			theNewImage.status 			= $scope.newImage._status;
			theNewImage.architecture	= $scope.newImage._architecture;
			theNewImage.diskdriver		= $scope.newImage._diskdriver;
			theNewImage.netdriver 		= $scope.newImage._netdriver;
			theNewImage.targetPool		= $scope.newImage._targetpool;

			$scope.theNewImage = theNewImage;


			$scope.imagenewalert = '';

			$image.save(theNewImage, function(theResult){
				$scope.fetchImages();
				$state.go('r.dashboard.images');
			});
		};

		$scope.appDelete = function(toDelete){
			$scope.curImage.apps.splice(toDelete-1,1);
			$scope.appSort();
			$scope.curImage.$update();
		};

		$scope.appMoveUp = function(toUp){
			if(toUp <= 1) return true;
			$scope.curImage.apps[toUp-2].order = toUp;
			$scope.curImage.apps[toUp-1].order = toUp-1;
			$scope.appSort();
			$scope.curImage.$update();
		};

		$scope.appMoveDown = function(toUp){
			if(toUp >= $scope.curImage.apps.length) return true;
			$scope.appMoveUp(parseInt(toUp,10)+1);
		};

		$scope.appSort = function(){
			if(!$scope.curImage.apps) return true;
			$scope.curImage.apps.sort(function(a,b){
				return parseInt(a.order, 10) - parseInt(b.order, 10);
			});
			var curOrder = 0;
			$scope.curImage.apps.forEach(function(curApp){
				curApp.order = ++curOrder;
			});
		};

		$scope.addApp2Image = function(){
			if(!$scope.curImage.apps) $scope.curImage.apps = [];
			var curMaxOrder = 0;
			$scope.curImage.apps.forEach(function(curExistingApp){
				if(parseInt(curExistingApp.order,10) > parseInt(curMaxOrder,10)) curMaxOrder = parseInt(curExistingApp.order,10);
			});
			curMaxOrder++;

			var curApp2Add = {
				name: $scope.curApp2AddName,
				version: $scope.curApp2AddVersion,
				order: curMaxOrder
			};
			var shouldAdd = true;
			$scope.curImage.apps.forEach(function(curExistingApp){
				if(curExistingApp.name == curApp2Add.name && curExistingApp.version == curApp2Add.version) shouldAdd = false;
			});
			if(shouldAdd){
				$scope.curImage.apps.push(curApp2Add);
				$scope.curImage.$update();
			} else {
				lnToastr.error("This application is already assigned to the immage");
			}
		};
	}
]);