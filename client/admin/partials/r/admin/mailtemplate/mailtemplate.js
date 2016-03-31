angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.mailtemplates', {
			url:"/mailtemplates",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/mailtemplate/mailtemplateList.html", controller: 'mailtemplateController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.mailtemplatenew', {
			url:"/mailtemplatenew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/mailtemplate/mailtemplateNew.html", controller: 'mailtemplateController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.mailtemplate', {
			url:"/mailtemplate/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/mailtemplate/mailtemplateDetail.html", controller: 'mailtemplateController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('srvcMailTemplate', ['$resource', '$rootScope', '$http', '$q',
	function serverService($resource, $rootScope, $http, $q) {
		var service = {};

		service.resource = $resource( '/api/mailtemplate/:id', { id: '@_id' }, { update: { method: 'PUT' } } );

		service.fetchAll = function(){		$rootScope.mailTemplates = service.resource.query(); 			};
		service.fetchOne = function(id){ 	$rootScope.curMailTemplate = service.resource.get({id:id});		};
		service.getBoundDocument = function(id){
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: '/api/mailtemplate/getBoundDocument/'+id
			}).then(function successCallback(response) {
				$rootScope.boundDocument = response.data;
				deferred.resolve(response.data);
			}, function errorCallback(response) {
				deferred.reject(response.data);
				toastr.error("Bound document Fetch Error:<br />" + response.data);
			});

			return deferred.promise;
		};

		return service;
	}
]);

angular.module('adminControllers').controller('mailtemplateController', ['$scope', '$rootScope', 'srvcMailTemplate', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage', 'srvcSettings', '$sce',
	function($scope, $rootScope, srvcMailTemplate, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage, srvcSettings, $sce){
		var lnToastr = toastr;
		$scope.curNewMailTemplate = { name:''};
		srvcMailTemplate.fetchAll();

		$scope.fetchSettings = function(){
			srvcSettings.fetch().then(function(){
				if($stateParams.id) $scope.setPreview();
			});
		};

		if($stateParams.id){
			srvcMailTemplate.fetchOne($stateParams.id);
			$scope.fetchSettings();
			srvcSettings.fetchCollections();
			srvcMailTemplate.getBoundDocument($stateParams.id);
		}

		$scope.setPreview = function () {
			$scope.currentPreviewURL = $sce.trustAsResourceUrl("/api/mailtemplate/preview/"+$stateParams.id);
		};

		$scope.mailTemplateTypes = [{value:"body", name:"Body"}, {value:"attachment", name: "Attachment"}];


		$scope.mailTemplateNew = function(){
			$scope.nbmodalInstance = $uibModal.open({
				animation: true,
				templateUrl: "/admin/partials/r/admin/mailtemplate/mailtemplateNewModal.html",
				size: 'md',
				scope: $scope
			});
		};

		$scope.openBoundDocumentModal = function(){
			$scope.bdmodalInstance = $uibModal.open({
				animation: true,
				templateUrl: "/admin/partials/r/admin/mailtemplate/mailtemplateBoundDocumentModal.html",
				size: 'lg',
				scope: $scope
			});
		};

		$scope.mailTemplateNewCancel = function(){
			$scope.nbmodalInstance.dismiss();
		};

		$scope.mailTemplateNewAction = function(){
			console.log($scope.curNewMailTemplate);
			srvcMailTemplate.resource.save($scope.curNewMailTemplate, function success(theResult){
				console.log(theResult);
				//$scope.fetchServers();
				//$state.go('r.server');
				srvcMailTemplate.fetchAll();
				$state.go($state.current, {}, {reload: true});
			}, function failure(issue){
				lnToastr.error("Mail Template creation failed.<br />Error message:<br />" + issue.data.message);
			});
		};

		$scope.saveMailTemplate = function(){
			$scope.curMailTemplate.$update(function(result){
				srvcMailTemplate.fetchAll();
				$state.go($state.current, {}, {reload: true});
			}, function(error){
				lnToastr.error(error);
			});
		};

		$scope.deleteMailTemplate = function(){
			if(confirm("Are you sure you want to delete " + $scope.curMailTemplate.name)){
				$scope.curMailTemplate.$delete(function(result, error){
					if(result.status == "fail"){
						alert("There was an error deleting the isofile");
						$state.go($state.current, {}, {reload: true});
					} else {
						//burada angular toaster kullanabiliriz.
						srvcMailTemplate.fetchAll();
						$state.go('r.dashboard.mailtemplates');
					}
				});
			}
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