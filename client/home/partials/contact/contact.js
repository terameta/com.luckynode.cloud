homeApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("");

    $stateProvider.
        state('home.contact', {
            url: "contact",
            views: {
					'mainBody@':		{ templateUrl: "/home/partials/contact/contact.html", controller: 'contactController' },
				},
            data: { requireSignin: false }
        });
});

angular.module('homeServices').service('srvcContact', ['$rootScope', '$http', '$q',
	function srvcUsersF($rootScope, $http, $q) {
		var service = {};

		service.sendContactRequest = function(name, email, comments){
			var deferred = $q.defer();
			$http({
				method: "POST",
				url: "/api/guest/contact/",
				data: {
					name: name,
					email: email,
					comments: comments
				}
			}).then(function successCB(response){
				deferred.resolve(response);
			}, function errorCB(response){
				deferred.reject(response);
			});
			return deferred.promise;
		};

		return service;
	}
]);

angular.module('homeControllers').controller('contactController', ['$scope', '$rootScope', 'srvcContact', '$state', '$stateParams', '$sce', 'srvcInformation',
	function($scope, $rootScope, srvcContact, $state, $stateParams, $sce, srvcInformation){
		var lnToastr = toastr;
		$scope.cfcResponse = '';

		if(!$rootScope.supportemail) srvcInformation.getInformation();

		$scope.sendStatus = '';
		$scope.sendSuccess = false;
		$scope.sendFail = false;

		$scope.sendContact = function(){
			console.log($scope.cfcResponse);
			if(!$scope.cfcResponse){
				lnToastr.error("Please validate the captcha.");
				return false;
			}
			srvcContact.sendContactRequest($scope.name, $scope.email, $scope.comments).then(function success(result){
				$scope.sendStatus = "Your message is sent to our sales department and you should receive a copy yourself.";
				$scope.sendSuccess = true;
				$scope.sendFail = false;
			}, function fail(issue){
				$scope.sendStatus = "Failed to send the message, please try again later or send a message to " + $rootScope.salesemail;
				$scope.sendFail = true;
				$scope.sendSuccess = false;
			});
		};
	}
]);