angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.logs', {
			url:"/logs",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/logs/logList.html", controller: 'logController' }
			},
			data: { requireSignin: true }
		})/*.state('r.dashboard.servernew', {
			url:"/servernew",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/server/serverNew.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.server', {
			url:"/server/:id",
			views: {
				'content@r.dashboard': { templateUrl: "partials/r/admin/server/serverDetail.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		})*/;
});

angular.module('cloudServices').service('$logs', ['$resource',
	function logService($resource) {
		return ( $resource(
			'/api/log/:id',
			{ id: '@_id' },
			{ update: { method: 'PUT' } }
		) );
	}
]);

angular.module('cloudControllers').controller('logController',['$scope', '$rootScope', '$state', '$stateParams', '$server', '$datacenter', '$plan', '$ipblock', '$node', '$image', '$modal', '$http', '$q', '$logs',
	function($scope, $rootScope, $state, $stateParams, $server, $datacenter, $plan, $ipblock, $node, $image, $modal, $http, $q, $logs){
		var lnToastr = toastr;

		var container, logHotTable;
		$scope.logData = [];

		$scope.fetchLogs = function(isFirstRun){
			$('#logHotTableContainer').width($('#logHotTableContainer').parent().width());
			$('#logHotTableContainer').height(window.innerHeight -100);
			$logs.query(function(result){
				if(result != $scope.logData){
					$scope.logData = result;
					if(!isFirstRun) logHotTable.loadData($scope.logData);
				}
				if(isFirstRun) initiateLogHotTable();
			});

		};


		$scope.fetchLogs(1);

		function initiateLogHotTable(){
			container 			= document.getElementById('logHotTable');
			logHotTable			= new Handsontable(container, {
				data: $scope.logData,
				//minSpareRows: 1,
				rowHeaders: false,
				autoWrapRow : true,
				manualColumnResize: true,
				colHeaders: true,
				contextMenu: false,
				afterChange: $scope.afterChange,
				beforeChange: $scope.beforeChange,
				columns: [
					{ title: 'ID', 				data: '_id', 		readOnly: true, 	type:'text'																					},
					{ title: 'Level', 			data: 'level', 		readOnly: true, 	type:'text'																					},
					{ title: 'When', 			data: 'date', 		readOnly: true, 	type:'text'																					},
					{ title: 'Message',			data: 'message',	readOnly: true, 	type:'text'																					},
					{ title: 'Origin',			data: 'origin',		readOnly: true, 	type:'text', renderer: "html"																},
					{ title: 'More',			data: 'metadata',	readOnly: true, 	type:'text', renderer: "html"																}
				]
			});
		}

		$scope.afterChange = function(){
		};

		$scope.beforeChange = function(){
		};

	}
]);