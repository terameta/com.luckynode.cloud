angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.support',{
			url: "/support",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/support/supportList.html", controller: 'ctrlSupport' }
			},
			data: { requireSignin: true }
		}).state('r.ticket',{
			url: "/ticket/:id",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/support/supportDetail.html", controller: 'ctrlSupport' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcSupport', ['$resource', '$rootScope', '$sce',
	function srvcInvoice($resource, $rootScope, $sce) {
		var service = {};
/*
		service.resource = $resource( '/api/client/invoice/:id', { id: '@_id' }, { update: { method: 'PUT' } });

		service.fetchAll = function(){
			$rootScope.invoices = service.resource.query(function(result){
				$rootScope.unpaidInvoices = 0;
				$rootScope.invoices.forEach(function(curInvoice){
					if(curInvoice.details.status != 'paid') $rootScope.unpaidInvoices++;
				});
			});

		};

		service.fetchAll();

		service.fetchOne = function(id){
			return service.resource.get({id: id});
		};
*/
		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlSupport', ['$scope', '$http', '$q', '$rootScope', '$state', '$stateParams', '$uibModal', 'srvcSupport', 'srvcConfirm', '$userService', '$window', 'srvcSettings', '$sce',
	function($scope, $http, $q, $rootScope, $state, $stateParams, $uibModal, srvcSupport,  srvcConfirm, $userService, $window, srvcSettings, $sce) {

		var lnToastr = toastr;

		srvcSettings.get().then(function(result){
			$rootScope.systemSettings = result;
		});

	}
]);