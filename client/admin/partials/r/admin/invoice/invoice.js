angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.invoices', {
			url:"/invoices",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/invoice/invoiceList.html", controller: 'invoiceController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.invoicenew', {
			url:"/invoicenew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/invoice/invoiceNew.html", controller: 'invoiceController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.invoice', {
			url:"/invoice/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/invoice/invoiceDetail.html", controller: 'invoiceController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('srvcInvoice', ['$resource', '$rootScope',
	function serverService($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/invoice/:id', { id: '@_id' }, { update: { method: 'PUT' } } );

		service.fetchAll = function(){
			$rootScope.invoices = service.resource.query(function(){
				$rootScope.invoices.forEach(function(theInvoice){
					calculateTotalValue(theInvoice, 'all');
				});
			});
		};
		service.fetchOne = function(id){
			$rootScope.curInvoice = service.resource.get({id:id}, function(result){
				result.$promise.then(function(){
					calculateTotalValue(result, 'one');
				});

			});
		};

		function calculateTotalValue(theInvoice, caller){
			var totalValue = 0;
			if(theInvoice.items){
				theInvoice.items.forEach(function(curItem){
					totalValue += parseFloat(curItem.finalPrice);
					totalValue -= parseFloat(curItem.finalDiscount);
				});
				theInvoice.totalValue = totalValue;
			}
		}

		return service;
	}
]);

angular.module('adminControllers').controller('invoiceController', ['$scope', '$rootScope', 'srvcInvoice', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage', 'srvcUsers',
	function($scope, $rootScope, srvcInvoice, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage, srvcUsers){
		var lnToastr = toastr;

		srvcInvoice.fetchAll();
		if($stateParams.id){ srvcInvoice.fetchOne($stateParams.id);	}

		$scope.saveInvoice = function(){
			$scope.recalculateInvoice($scope.curInvoice);
			$scope.reAssignDetails($scope.curInvoice);
			$scope.curInvoice.$update(function(result){
				srvcInvoice.fetchAll();
				srvcInvoice.fetchOne($stateParams.id);
			}, function(error){
				lnToastr.error(error);
			});
		};

		$scope.reAssignDetails = function(invoice){
			$scope.users.forEach(function(curUser){
				if(curUser._id == $scope.curInvoice.details.user){
					console.log(curUser);
					if(curUser.name && curUser.surname) $scope.curInvoice.details.to = curUser.name + ' ' + curUser.surname;
					if(curUser.payto) $scope.curInvoice.details.payTo = curUser.payto;
					if(curUser.address) $scope.curInvoice.details.toAddress = curUser.address;
					if(curUser.city) $scope.curInvoice.details.toAddress += " / " + curUser.city;
					if(curUser.country) $scope.curInvoice.details.toAddress += " / " + curUser.country;
				}
			});
		};

		$scope.recalculateInvoice = function(invoice){
			console.log(invoice.items);
			invoice.priceTotal = 0;
			invoice.discountTotal = 0;
			invoice.netTotal = 0;
			invoice.items.forEach(function(curItem){
				curItem.finalPrice = curItem.price * curItem.multiplier;
				curItem.finalDiscount = curItem.discount * curItem.multiplier;
				curItem.finalNet = curItem.finalPrice - curItem.finalDiscount;
				invoice.priceTotal += parseFloat(curItem.finalPrice);
				invoice.discountTotal += parseFloat(curItem.finalDiscount);
				invoice.netTotal += parseFloat(curItem.finalNet);
			});
			invoice.netTotal = parseFloat(invoice.netTotal).toFixed(2);
		};

		$scope.addItem = function(){
			$scope.curInvoice.items.push({name:'Please edit this item', multiplier:1});
		};

		$scope.removeItem = function(curIndex){
			$scope.curInvoice.items.splice(curIndex,1);
			$scope.saveInvoice();
		};

		$scope.formatCurrency = function(value){
			return '$' + parseFloat(value).toFixed(2);
		};

		$scope.formatDate = function(value){
			return moment(value).format('Do MMMM, YYYY');
		};

		$scope.deleteInvoice = function(){
			if(confirm("Are you sure you want to delete " + $scope.curInvoice._id)){
				$scope.curInvoice.$delete(function(result, error){
					if(result.status == "fail"){
						lnToastr.error("There was an error deleting the invoice");
						$state.go($state.current, {}, {reload: true});
					} else {
						lnToastr.info("Invoice is deleted.");
						srvcInvoice.fetchAll();
						$state.go('r.dashboard.invoices');
					}
				});
			}
		};
	}
]);