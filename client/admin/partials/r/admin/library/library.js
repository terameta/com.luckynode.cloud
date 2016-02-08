angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.library', {
			url:"/library",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/library/library.html", controller: 'libraryController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.librarynew', {
			url:"/librarynew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/library/libraryNew.html", controller: 'libraryController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.libraryitem', {
			url:"/library/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/library/libraryDetail.html", controller: 'libraryController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcLibrary', ['$resource', '$rootScope', '$http', '$q',
	function serverService($resource, $rootScope, $http, $q) {
		var service = {};

		service.resource = $resource( '/api/library/:id', { id: '@_id' }, { update: { method: 'PUT' } } );

		service.fetchAll = function(){		$rootScope.tutorials = service.resource.query(); 			};
		service.fetchOne = function(id){ 	$rootScope.curTutorial = service.resource.get({id:id});		};

		return service;
	}
]);

angular.module('cloudControllers').controller('libraryController', ['$scope', '$rootScope', 'srvcLibrary', '$state', '$stateParams', '$localStorage', '$http', '$q', '$uibModal', '$sce', 'srvcSettings',
	function($scope, $rootScope, srvcLibrary, $state, $stateParams, $localStorage, $http, $q, $uibModal, $sce, srvcSettings){
		var lnToastr = toastr;
		$scope.curNewTutorial = {name:''};

		srvcLibrary.fetchAll();

		$scope.tutorialNew = function(){
			$scope.nbmodalInstance = $uibModal.open({
				animation: true,
				templateUrl: "/admin/partials/r/admin/library/libraryNewModal.html",
				size: 'md',
				scope: $scope
			});
		};

		$scope.tutorialNewCancel = function(){
			$scope.nbmodalInstance.dismiss();
		};

		$scope.tutorialNewAction = function(){
			console.log($scope.curNewTutorial);
			srvcLibrary.resource.save($scope.curNewTutorial, function success(theResult){
				console.log(theResult);
				//$scope.fetchServers();
				//$state.go('r.server');
				srvcLibrary.fetchAll();
				$state.go($state.current, {}, {reload: true});
			}, function failure(issue){
				lnToastr.error("Mail Template creation failed.<br />Error message:<br />" + issue.data.message);
			});
		};

		$scope.setPreview = function () {
			$scope.currentPreviewURL = $sce.trustAsResourceUrl($rootScope.settings.domain+"/api/library/preview/"+$stateParams.id);
		};

		$scope.fetchSettings = function(){
			srvcSettings.fetch().then(function(){
				if($stateParams.id) $scope.setPreview();
			});
		};

		if($stateParams.id){
			srvcLibrary.fetchOne($stateParams.id);
			$scope.fetchSettings();
		}

		$scope.saveTutorial = function(){
			$scope.curTutorial.$update(function(result){
				srvcLibrary.fetchAll();
				$state.go($state.current, {}, {reload: true});
			}, function(error){
				lnToastr.error(error);
			});
		};

		$scope.aceLoaded = function(_editor) {
			// Options
			//_editor.setReadOnly(true);
			//console.log("AceLoaded");
			_editor.getSession().setUseSoftTabs(false);
			_editor.getSession().setTabSize(2);
			// This is to remove following warning message on console:
			// Automatically scrolling cursor into view after selection change this will be disabled in the next version
			// set editor.$blockScrolling = Infinity to disable this message
			_editor.$blockScrolling = Infinity;
		};

		$scope.aceChanged = function(e) {
			//
			//console.log("AceChanged");
			//console.log($scope.curMailTemplate);
		};


	}
]);