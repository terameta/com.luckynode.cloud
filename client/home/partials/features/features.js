homeApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("");

    $stateProvider.
        state('home.features', {
            url: "features",
            views: {
					'mainBody@':		{ templateUrl: "/home/partials/features/features.html" },
				},
            data: { requireSignin: false }
        });
});