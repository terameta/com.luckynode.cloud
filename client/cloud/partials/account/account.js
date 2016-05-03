angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.account',{
			url: "/account",
			views: {
				'content@r': 	{ templateUrl: "/cloud/partials/account/account.html", controller: 'ctrlAccount' }
			},
			data: { requireSignin: true }
		});
});

angular.module('cloudServices').service('srvcAccount', ['$resource', '$rootScope', '$sce', '$http',
	function srvcAccount($resource, $rootScope, $sce, $http) {
		var service = {};

		service.accountBalance = function(){
			$http.get('/api/client/account').then(function /*success*/(response){
				$rootScope.accountBalance = response.data.accountBalance;
				$rootScope.shouldMakePayment = ($rootScope.accountBalance > 0);
				$rootScope.accountTransactions = response.data.transactions;
			}, function /*fail*/(response){
				console.log("Fail:", response);
			});
		};

		service.accountBalance();

		return service;
	}
]);

angular.module('cloudControllers').controller('ctrlAccount', ['$scope', '$http', '$q', '$rootScope', '$state', '$stateParams', '$uibModal', 'srvcConfirm', '$userService', '$window', 'srvcSettings', '$sce', 'srvcAccount',
	function($scope, $http, $q, $rootScope, $state, $stateParams, $uibModal, srvcConfirm, $userService, $window, srvcSettings, $sce, srvcAccount) {
		srvcAccount.accountBalance();

		var lnToastr = toastr;

		srvcSettings.get().then(function(result){
			$rootScope.systemSettings = result;
			if($rootScope.systemSettings.paypal.issandbox == 'true'){
				$rootScope.systemSettings.paypalformlink = $sce.trustAsResourceUrl('https://www.sandbox.paypal.com/cgi-bin/webscr');
			} else {
				$rootScope.systemSettings.paypalformlink = $sce.trustAsResourceUrl('https://www.paypal.com/cgi-bin/webscr');
			}
		});

		$scope.formatCurrency = function(value){
			if(parseFloat(value) >= 0){
				return '$' + parseFloat(value).toFixed(2);
			} else {
				return '$(' + parseFloat(value).toFixed(2)*(-1) + ')';
			}
		};

		$scope.formatDate = function(value){
			return moment(value).format('Do MMMM, YYYY');
		};

		$scope.formatDateTime = function(value){
			return moment(value).format('Do MMMM, YYYY - HH:mm');
		};

		$scope.ccYears = [];
		for(var i = 0; i < 50; i++){
			$scope.ccYears.push(moment().add(i, 'year').year());
		}

		$scope.ccMonths = [
			{value:'01', name:'Jan'},
			{value:'02', name:'Feb'},
			{value:'03', name:'Mar'},
			{value:'04', name:'Apr'},
			{value:'05', name:'May'},
			{value:'06', name:'Jun'},
			{value:'07', name:'Jul'},
			{value:'08', name:'Aug'},
			{value:'09', name:'Sep'},
			{value:'10', name:'Oct'},
			{value:'11', name:'Nov'},
			{value:'12', name:'Dec'}
		];

		$scope.ccDetails = {
			expMonth: '01',
			expYear: moment().year()
		};

		$scope.submitCC = function(){
			if(isNaN(parseInt($("#expMonth").val(),10))){ 	$scope.ccDetails.info = '<i class="fa fa-times fa-fw"></i> Please select an expiry month for the card.'; return false; }
			if(isNaN(parseInt($("#expYear").val(),10))){ 	$scope.ccDetails.info = '<i class="fa fa-times fa-fw"></i> Please select an expiry year for the card.'; return false; }
			$scope.submitCCdisabled = true;
			$scope.ccDetails.info = '<i class="fa fa-circle-o-notch fa-spin"></i> Please wait validating...';
			TCO.loadPubKey('production', $scope.submitCCTokenRequest);
		};

		$scope.submitCCTokenRequest = function(){
			var args = {
				sellerId: $rootScope.systemSettings.tco.sellerid,
				publishableKey: $rootScope.systemSettings.tco.publishablekey,
				ccNo: $("#ccNo").val(),
				cvv: $("#cvv").val(),
				expMonth: $("#expMonth").val(),
				expYear: $("#expYear").val()
			};
			//console.log("Args:",args);
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
			$scope.ccDetails.info = '<i class="fa fa-times fa-fw"></i> Failure to validate card. Please check details below.<br />';
			$scope.ccDetails.info+= '<i class="fa fa-times fa-fw"></i> '+error.errorMsg;
			$scope.submitCCdisabled = false;
			$scope.$apply();
		};

		$scope.ccDetails = {};

		$scope.paywithCC = function(){
			$scope.paywithCCInstance = $uibModal.open({
				animation: true,
				templateUrl: "/cloud/partials/account/paymentOptionCC.html",
				size: 'md',
				scope: $scope
			});
			if(!$scope.curUser.fullName){
				$userService.getCurUserDetails().then(function(result){
					console.log("Cur User Details");
					console.log(result);
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
			console.log(tokenObject);
			$http.post('/api/payment/tco/pay/',tokenObject).
				success(function(data, status, headers, config){
					if(data == 'OK') $state.go($state.current, {}, {reload: true});
					$scope.submitCCdisabled = false;
					srvcAccount.accountBalance();
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