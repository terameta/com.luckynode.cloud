angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.imagegroups', {
			url:"/imagegroups",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/imagegroup/imagegroupList.html", controller: 'imagegroupController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.imagegroupnew', {
			url:"/imagegroupnew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/imagegroup/imagegroupNew.html", controller: 'imagegroupController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.imagegroup', {
			url:"/imagegroup/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/imagegroup/imagegroupDetail.html", controller: 'imagegroupController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('srvcImageGroup', ['$resource', '$rootScope',
	function serverService($resource, $rootScope) {
		var service = {};
		service.resource = ( $resource(
			'/api/imagegroup/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );

		service.fetchAll = function(){
			$rootScope.imagegroups = service.resource.query();
		};

		service.fetchAll();

		service.fetchOne = function(id){
			return service.resource.get({id: id});
		};

		service.getTypes = function(){return [{name:"Hidden", value: "hidden"},{name:"Public", value: "public"}];};

		return service;
	}
]);

angular.module('adminControllers').controller('imagegroupController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', 'srvcImageGroup', '$storage',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, srvcImageGroup, $storage){
		var lnToastr = toastr;

		if($stateParams.id){
			$scope.curImageGroup = srvcImageGroup.fetchOne($stateParams.id);
		}

		$scope.imageGroupTypes = srvcImageGroup.getTypes();

		$scope.addImageGroup = function(){
			if(!$scope.newImageGroup._name){ 					$scope.newitemalert = "Name can't be empty";							return 0;   }

			var theNewImageGroup 			= {};
			theNewImageGroup.name 			= $scope.newImageGroup._name;
			theNewImageGroup.description 	= $scope.newImageGroup._description;

			$scope.newitemalert = '';

			srvcImageGroup.resource.save(theNewImageGroup, function(theResult){
			//	console.log(theResult);
				srvcImageGroup.fetchAll();
				$state.go('r.dashboard.imagegroups');
			});
		};

		$scope.saveImageGroup = function(){
			$scope.curImageGroup.$update(function(result){
				srvcImageGroup.fetchAll();
			}, function(error){
				lnToastr.error(error);
			});
		};

		$scope.deleteImageGroup = function(){
			if(confirm("Are you sure you want to delete " + $scope.curImageGroup.name)){
				$scope.curImageGroup.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the image");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						srvcImageGroup.fetchAll();
						$state.go('r.dashboard.imagegroups');
					}
				}, function(error){
					lnToastr.error("We couldn't delete the image");
				});
			}
		};
	}
]);