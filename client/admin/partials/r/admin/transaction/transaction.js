angular.module('adminApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.transactions', {
			url:"/transactions",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/transaction/transactionList.html", controller: 'transactionController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.transactionnew', {
			url:"/transactionnew",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/transaction/transactionNew.html", controller: 'transactionController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.transaction', {
			url:"/transaction/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/admin/partials/r/admin/transaction/transactionDetail.html", controller: 'transactionController' }
			},
			data: { requireSignin: true }
		});
});

angular.module('adminServices').service('srvcTransaction', ['$resource', '$rootScope',
	function serverService($resource, $rootScope) {
		var service = {};

		service.resource = $resource( '/api/transaction/:id', { id: '@_id' }, { update: { method: 'PUT' } } );

		service.fetchAll = function(){
			$rootScope.transactions = service.resource.query(function(){
				$rootScope.transactions.forEach(function(theTransaction){
					calculateTotalValue(theTransaction, 'all');
				});
			});
		};
		service.fetchOne = function(id){
			$rootScope.curTransaction = service.resource.get({id:id}, function(result){
				result.$promise.then(function(){
					calculateTotalValue(result, 'one');
				});

			});
		};

		function calculateTotalValue(theTransaction, caller){
			var totalValue = 0;
			if(theTransaction.items){
				theTransaction.items.forEach(function(curItem){
					totalValue += parseFloat(curItem.finalPrice);
					totalValue -= parseFloat(curItem.finalDiscount);
				});
				theTransaction.totalValue = totalValue;
			}
		}

		return service;
	}
]);

angular.module('adminControllers').controller('transactionController', ['$scope', '$rootScope', 'srvcTransaction', '$state', '$stateParams', '$localStorage', '$datacenter', '$http', '$q', '$uibModal', '$storage', 'srvcUsers',
	function($scope, $rootScope, srvcTransaction, $state, $stateParams, $localStorage, $datacenter, $http, $q, $uibModal, $storage, srvcUsers){
		var lnToastr = toastr;

		srvcTransaction.fetchAll();
		if($stateParams.id){ srvcTransaction.fetchOne($stateParams.id).$promise.then(function(result){console.log("Hede:", result);});	}

		$scope.saveTransaction = function(){
			$scope.curTransaction.$update(function(result){
				srvcTransaction.fetchAll();
				srvcTransaction.fetchOne($stateParams.id);
			}, function(error){
				lnToastr.error(error);
			});
		};

		$scope.formatCurrency = function(value){
			return '$' + parseFloat(value).toFixed(2);
		};

		$scope.formatDate = function(value){
			return moment(value).format('Do MMMM, YYYY');
		};

		$scope.deleteTransaction = function(){
			if(confirm("Are you sure you want to delete " + $scope.curTransaction._id)){
				$scope.curTransaction.$delete(function(result, error){
					if(result.status == "fail"){
						lnToastr.error("There was an error deleting the transaction");
						$state.go($state.current, {}, {reload: true});
					} else {
						lnToastr.info("Transaction is deleted.");
						srvcTransaction.fetchAll();
						$state.go('r.dashboard.transactions');
					}
				});
			}
		};
	}
]);