angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.invoices',{
			url: "/invoices",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/invoice/invoiceList.html", controller: 'ctrlInvoice' }
			},
			data: { requireSignin: true }
		}).state('r.invoice',{
			url: "/invoice/:id",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/invoice/invoiceDetail.html", controller: 'ctrlInvoice' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcInvoice', ['$resource', '$rootScope', '$sce',
	function srvcEndUser($resource, $rootScope, $sce) {
		var service = {};

		service.resource = $resource( '/api/client/invoice/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchAll = function(){
			$rootScope.invoices = service.resource.query();
		};

		service.fetchAll();

		service.fetchOne = function(id){
			return service.resource.get({id: id});
		};

		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlInvoice', ['$scope', '$http', '$q', '$rootScope', '$state', '$stateParams', '$uibModal', 'srvcInvoice', 'srvcConfirm',
	function($scope, $http, $q, $rootScope, $state, $stateParams, $uibModal, srvcInvoice,  srvcConfirm) {

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
			srvcInvoice.fetchOne($stateParams.id).$promise.then(function(result){
				$scope.curInvoice = result;
			});
		}

		$scope.formatCurrency = function(value){
			return '$' + parseFloat(value).toFixed(2);
		};

		$scope.formatDate = function(value){
			return moment(value).format('Do MMMM, YYYY');
		};

	}
]);