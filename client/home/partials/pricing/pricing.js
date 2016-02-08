homeApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("");

    $stateProvider.
        state('home.pricing', {
            url: "pricing",
            views: {
					'mainBody@':		{ templateUrl: "/home/partials/pricing/pricing.html" },
				},
            data: { requireSignin: false }
        });
});