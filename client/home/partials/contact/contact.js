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

		service.sendContactRequest = function(){
			var deferred = $q.defer();
			$http({
				method: "POST",
				url: "/api/guest/contact/",
				data: {zöbelek:'hede'}
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

		if(!$rootScope.supportemail) srvcInformation.getInformation();

		$scope.sendContact = srvcContact.sendContactRequest;
	}
]);