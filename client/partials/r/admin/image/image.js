angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.images', {
			url:"/images",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/image/imageList.html", controller: 'imageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.imagenew', {
			url:"/imagenew",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/image/imageNew.html", controller: 'imageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.imagenewfromserver', {
			url:"/imagenewfromserver",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/image/imageNewFromServer.html", controller: 'imageController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.image', {
			url:"/image/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/image/imageDetail.html", controller: 'imageController' }
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

angular.module('cloudControllers').controller('imageController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', '$image', '$storage',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, $image, $storage){
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
		$scope.imageDiskTypes = [{ value:'qcow2', text: 'QCoW2' }, { value:'raw', text: 'Raw'}];

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
				console.log($scope.curImage);
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
				if(confirm("Do you want the base file to be erased as well?")){
					$scope.curImage.erasefile = true;
				} else {
					$scope.curImage.erasefile = false;
				}
				$scope.curImage.$delete({shouldErase: $scope.curImage.erasefile}, function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the image");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						$scope.fetchImages();
						$state.go('r.dashboard.images');
					}
				});
			}
		};

		$scope.cancelImageAdd = function(){
			$state.go('r.dashboard.images');
		};

		$scope.imageFromServerServerChange = function(){
			$scope.newImage._diskdriver = $scope.newImage._baseserver.diskdriver;
			$scope.newImage._netdriver 	= $scope.newImage._baseserver.netdriver;
		};

		$scope.addImageFromServer = function(){
			if(!$scope.newImage._name){ 					$scope.imagenewalert = "Name can't be empty";							return 0;   }
			if(!$scope.newImage._baseserver){				$scope.imagenewalert = "Please select a base server";					return 0;   }
			if(!$scope.newImage._status){					$scope.imagenewalert = "Please select a status";						return 0;   }
			if(!$scope.newImage._architecture){				$scope.imagenewalert = "Please select an architecture";					return 0;   }
			if(!$scope.newImage._diskdriver){				$scope.imagenewalert = "Please select a disk driver";					return 0;   }
			if(!$scope.newImage._netdriver){				$scope.imagenewalert = "Please select a network driver";				return 0;   }
			if(!$scope.newImage._imagetype){				$scope.imagenewalert = "Please select an image type";					return 0;   }

			var theNewImage 			= {};
			theNewImage.name 			= $scope.newImage._name;
			theNewImage.description 	= $scope.newImage._description;
			theNewImage.baseserver		= $scope.newImage._baseserver._id;
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
	}
]);