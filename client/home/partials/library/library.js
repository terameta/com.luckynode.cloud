homeApp.config(function($stateProvider, $urlRouterProvider){
	 $urlRouterProvider.otherwise("");

	 $stateProvider.
		  state('home.library', {
				url: "library",
				views: {
					'mainBody@':		{ templateUrl: "/home/partials/library/library.html", controller: 'libraryController'  },
				},
				data: { requireSignin: false }
			}).state('home.libraryitem', {
				url: "library/:id/:nameurl",
				views: {
					'mainBody@': 		{ templateUrl: "/home/partials/library/library.html",	controller: 'libraryController' }
				},
			});
});

angular.module('homeServices').service('srvcLibrary', ['$resource', '$rootScope', '$http', '$q', '$sce',
	function serverService($resource, $rootScope, $http, $q, $sce) {
		var service = {};

		service.resource = $resource( '/api/client/library/:id', { id: '@_id' }, { update: { method: 'PUT' } } );

		service.fetchAll = function(){
			var deferred = $q.defer();
			$rootScope.tutorials = service.resource.query(function(result){
				service.arrange();
				deferred.resolve();
			});
			return deferred.promise;
		};
		service.fetchOne = function(id){
			$rootScope.curTutorial = service.resource.get({id:id}, function(result){
				$rootScope.tutorialContent = $sce.trustAsHtml($rootScope.curTutorial.content);
			});

		};

		service.arrange = function(){
			$rootScope.tutorials.forEach(function(curTutItem){
				curTutItem.nameurl = curTutItem.name.replace(/ /g, '-').replace(/\./g, '') + '.html';
			});
			$rootScope.libTree = treeify($rootScope.tutorials,"_id", "parent", "children");
		};

		return service;
	}
]);

angular.module('homeControllers').controller('libraryController', ['$scope', '$rootScope', 'srvcLibrary', '$state', '$stateParams', '$sce',
	function($scope, $rootScope, srvcLibrary, $state, $stateParams, $sce){
		var lnToastr = toastr;

		srvcLibrary.fetchAll().then(function(){
			if($stateParams.id){
				$rootScope.tutorials.forEach(function(curTutItem, curTutIndex){
					if(curTutItem._id == $stateParams.id){
						$scope.selectedTutorial = $rootScope.tutorials[curTutIndex];
						$scope.selectedAncestors.push($scope.selectedTutorial);
						findAncestors(curTutItem["parent"],$scope.selectedAncestors);
					}
				});
			}
		});

		function findAncestors(curId, parentList){
			$rootScope.tutorials.forEach(function(curTutItem, curTutIndex){
				if(curId == curTutItem._id){
					parentList.push($rootScope.tutorials[curTutIndex]);
					findAncestors(curTutItem["parent"], parentList);
				}
			});
		}

		if($stateParams.id){
			srvcLibrary.fetchOne($stateParams.id);
			$scope.curTutorialID = $stateParams.id;
		} else {
			$rootScope.tutorialContent = '';
		}

		$scope.treeOptions = {
			nodeChildren: "children",
			dirSelectable: true,
			injectClasses: {
				ul: "a1",
				li: "a2",
				liSelected: "a7",
				iExpanded: "a3",
				iCollapsed: "a4",
				iLeaf: "a5",
				label: "a6",
				labelSelected: "a8"
			}
		};

		$scope.showSelected = function(theNode){
			//console.log(theNode, $scope.selectedTutorial);
		};

		$scope.setSelected = function(theSelected){
			if(theSelected == "search"){
				$scope.searchSelected = true;
				$scope.browseSelected = false;
			} else {
				$scope.searchSelected = false;
				$scope.browseSelected = true;
			}
		};
	}
]);

function treeify(list, idAttr, parentAttr, childrenAttr) {
	if (!idAttr) idAttr = 'id';
	if (!parentAttr) parentAttr = 'parent';
	if (!childrenAttr) childrenAttr = 'children';

	var treeList = [];
	var lookup = {};
	list.forEach(function(obj) {
		lookup[obj[idAttr]] = obj;
		obj[childrenAttr] = [];
	});
	list.forEach(function(obj) {
		if (obj[parentAttr] != null && obj[parentAttr] != 0) {
			lookup[obj[parentAttr]][childrenAttr].push(obj);
		}
		else {
			treeList.push(obj);
		}
	});
	return treeList;
}