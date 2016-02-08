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
	function srvcInvoice($resource, $rootScope, $sce) {
		var service = {};

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

		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlInvoice', ['$scope', '$http', '$q', '$rootScope', '$state', '$stateParams', '$uibModal', 'srvcInvoice', 'srvcConfirm', '$userService', '$window', 'srvcSettings', '$sce',
	function($scope, $http, $q, $rootScope, $state, $stateParams, $uibModal, srvcInvoice,  srvcConfirm, $userService, $window, srvcSettings, $sce) {

		var lnToastr = toastr;

		srvcSettings.get().then(function(result){
			$rootScope.systemSettings = result;
			if($rootScope.systemSettings.paypal.issandbox == 'true'){
				$rootScope.systemSettings.paypalformlink = $sce.trustAsResourceUrl('https://www.sandbox.paypal.com/cgi-bin/webscr');
			} else {
				$rootScope.systemSettings.paypalformlink = $sce.trustAsResourceUrl('https://www.paypal.com/cgi-bin/webscr');
			}

		});

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

		$scope.formatDateTime = function(value){
			return moment(value).format('Do MMMM, YYYY - HH:mm');
		};

		$scope.submitCC = function(){
			$scope.submitCCdisabled = true;
			$scope.ccDetails.info = '<i class="fa fa-circle-o-notch fa-spin"></i> Please wait validating...';
			TCO.loadPubKey('sandbox', $scope.submitCCTokenRequest);
		};

		$scope.submitCCTokenRequest = function(){
			var args = {
				sellerId: "901303695",
				publishableKey: "B3D20843-87E0-4ED0-B3C3-AA02291C56F9",
				ccNo: $("#ccNo").val(),
				cvv: $("#cvv").val(),
				expMonth: $("#expMonth").val(),
				expYear: $("#expYear").val()
			};

			// Make the token request
			TCO.requestToken($scope.submitCC.sCallBack, $scope.submitCC.eCallBack, args);
		};

		$scope.submitCCdisabled = false;

		$scope.submitCC.sCallBack = function (result){
			//console.log(result);
			$scope.ccDetails.info = '<i class="fa fa-check-circle fa-fw"></i> Your card is validated. We will now process the payment.<br /><i class="fa fa-circle-o-notch fa-spin"></i> Please wait we are processing...';
			$scope.submitCCdisabled = true;
			$scope.$apply();
			$scope.paywithCCAction(result);
		};

		$scope.submitCC.eCallBack = function (error){
			console.log(error);
			$scope.ccDetails.info = '<i class="fa fa-times fa-fw"></i> Failure to validate card. Please check details below.';
			$scope.submitCCdisabled = false;
			$scope.$apply();
		};

		$scope.ccDetails = {};

		$scope.paywithCC = function(){
			$scope.paywithCCInstance = $uibModal.open({
				animation: true,
				templateUrl: "/cloud/partials/invoice/paymentOptionCC.html",
				size: 'md',
				scope: $scope
			});
			if(!$scope.curUser.fullName){
				$userService.getCurUserDetails().then(function(result){
					$scope.curUser.fullName = result.name + ' ' + result.surname;
					$scope.ccDetails.holder = $scope.curUser.fullName.toUpperCase();
				}, function(issue){
					//console.log(a,b,c,d);
				});
			} else {
				$scope.ccDetails.holder = $scope.curUser.fullName.toUpperCase();
			}

		};

		$scope.paywithCCAction = function(tokenObject){
			tokenObject.holder = $scope.ccDetails.holder;
			$http.post('/api/payment/tco/pay/'+$stateParams.id,tokenObject).
				success(function(data, status, headers, config){
					if(data == 'OK') $state.go($state.current, {}, {reload: true});
					$scope.submitCCdisabled = false;
				}).
				error(function(data, status, headers, config){
					//console.log("Error",data);
					$scope.ccDetails.info = '<i class="fa fa-times fa-fw"></i> ' + data.detail;
					$scope.submitCCdisabled = false;
				});
		};

		$scope.ccNumChange = function(){
			//console.log("Card number has changed", $scope.ccDetails);
			$scope.ccDetails.ccType = '';
			if($scope.ccDetails.no.substring(0,1) == '4') 																					$scope.ccDetails.ccType = 'cc-visa';
			if(parseInt($scope.ccDetails.no.substring(0,4),10) >= 2221 && parseInt($scope.ccDetails.no.substring(0,4),10) <= 2720) 			$scope.ccDetails.ccType = 'cc-mastercard';
			if(parseInt($scope.ccDetails.no.substring(0,2),10) >= 51 && parseInt($scope.ccDetails.no.substring(0,2),10) <= 55) 				$scope.ccDetails.ccType = 'cc-mastercard';
			if(parseInt($scope.ccDetails.no.substring(0,4),10) == 6011) 																	$scope.ccDetails.ccType = 'cc-discover';
			if(parseInt($scope.ccDetails.no.substring(0,6),10) >= 622126 && parseInt($scope.ccDetails.no.substring(0,6),10) <= 622925) 		$scope.ccDetails.ccType = 'cc-discover';
			if(parseInt($scope.ccDetails.no.substring(0,3),10) >= 644 && parseInt($scope.ccDetails.no.substring(0,3),10) <= 649) 			$scope.ccDetails.ccType = 'cc-discover';
			if(parseInt($scope.ccDetails.no.substring(0,2),10) == 65) 																		$scope.ccDetails.ccType = 'cc-discover';
			if(parseInt($scope.ccDetails.no.substring(0,2),10) == 34) 																		$scope.ccDetails.ccType = 'cc-amex';
			if(parseInt($scope.ccDetails.no.substring(0,2),10) == 37) 																		$scope.ccDetails.ccType = 'cc-amex';
			if(parseInt($scope.ccDetails.no.substring(0,2),10) == 36) 																		$scope.ccDetails.ccType = 'cc-diners-club';
			if(parseInt($scope.ccDetails.no.substring(0,2),10) == 38) 																		$scope.ccDetails.ccType = 'cc-diners-club';
			if(parseInt($scope.ccDetails.no.substring(0,2),10) == 39) 																		$scope.ccDetails.ccType = 'cc-diners-club';
			if(parseInt($scope.ccDetails.no.substring(0,3),10) == 309) 																		$scope.ccDetails.ccType = 'cc-diners-club';
			if(parseInt($scope.ccDetails.no.substring(0,3),10) >= 300 && parseInt($scope.ccDetails.no.substring(0,3),10) <= 305) 			$scope.ccDetails.ccType = 'cc-diners-club';
			if(parseInt($scope.ccDetails.no.substring(0,4),10) >= 3528 && parseInt($scope.ccDetails.no.substring(0,4),10) <= 3589) 			$scope.ccDetails.ccType = 'cc-jcb';
			if($scope.ccDetails.ccType){
				$scope.ccDetails.ccType = "<i class=\"fa fa-"+ $scope.ccDetails.ccType +" fa-fw\"></i>";
			} else {
				$scope.ccDetails.ccType = "<i class=\"fa fa-credit-card-alt fa-fw\"></i>";
			}
		};
	}
]);