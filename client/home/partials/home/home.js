homeApp.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("");

    $stateProvider.
        state('home', {
            url: "/",
            views: {
					'mainMenu':		{ templateUrl: "/home/partials/home/menu.html" },
					'mainBody':		{ templateUrl: "/home/partials/home/home.html" },
				},
            data: { requireSignin: false }
        });
});