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

angular.module('homeControllers').controller('contactController', ['$scope', '$rootScope', 'srvcLibrary', '$state', '$stateParams', '$sce', 'srvcInformation',
	function($scope, $rootScope, srvcLibrary, $state, $stateParams, $sce, srvcInformation){
		var lnToastr = toastr;

		if(!$rootScope.supportemail) srvcInformation.getInformation();
	}
]);