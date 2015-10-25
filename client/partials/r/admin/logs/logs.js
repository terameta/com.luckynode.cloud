angular.module('cloudApp').config(function($stateProvider, $urlRouterProvider){
	$stateProvider.state('r.dashboard.logs', {
			url:"/logs",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/logs/logList.html", controller: 'logController' }
			},
			data: { requireSignin: true }
		})/*.state('r.dashboard.servernew', {
			url:"/servernew",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/server/serverNew.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		}).state('r.dashboard.server', {
			url:"/server/:id",
			views: {
				'content@r.dashboard': { templateUrl: "/partials/r/admin/server/serverDetail.html", controller: 'serverController' }
			},
			data: { requireSignin: true }
		})*/;
});

angular.module('cloudServices').service('$logs', ['$resource',
	function logService($resource) {
		return ( $resource(
			'/api/logs/:id',
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

		$scope.filter = {};

		$scope.clearLogs = function(){
			if(confirm("Are you sure delete all records?")){
				$http({
					method: 'POST',
					url: '/api/logs/delete/'
				}).then(function successCallback(response){
					lnToastr.info("Logs are cleared");
					$scope.fetchLogs();
				}, function errorCallback(response){
					lnToastr.error("Failed to clear data<hr />" + response.data);
				});
			}
		};

		$scope.fetchLogs = function(isFirstRun){
			$('#logHotTableContainer').width($('#logHotTableContainer').parent().width());
			$('#logHotTableContainer').height(window.innerHeight -130);
			$http({
				method: 'POST',
				url: '/api/logs/',
				data: {
					limit: $scope.listLimit,
					filter: $scope.filter
				}
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available
				$scope.mapData = response.data;
				$scope.numberofMapRecords = "#Map<br />"+$scope.mapData.length;
				if(isFirstRun)	initiateLogHotTable();
				if(response.data != $scope.logData){
					$scope.logData = response.data;
					$scope.logData.forEach(function(curLog){
						curLog.metadata = "<pre>" + JSON.stringify(curLog.metadata, '\n', ' ') + "</pre>";
					});
					logHotTable.loadData($scope.logData);
				}
			}, function errorCallback(response) {
				lnToastr.error("Failed to receive map");
			});
			/*
			$logs.query(function(result){
				if(result != $scope.logData){
					$scope.logData = result;
					if(!isFirstRun) logHotTable.loadData($scope.logData);
				}
				if(isFirstRun) initiateLogHotTable();
			});
			*/
		};

		$scope.listLimit = 100;
		$scope.shouldAutoRefresh = true;
		$scope.refreshInterval = '';

		$scope.setRefreshInterval = function(){
			$scope.refreshInterval = setInterval(function(){
				$scope.fetchLogs();
			}, 5000);
		};

		$scope.shouldAutoRefreshChange = function(){
			if($scope.shouldAutoRefresh){
				$scope.setRefreshInterval();
			} else {
				clearInterval($scope.refreshInterval);
			}
		};

		$scope.shouldAutoRefreshChange();


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
				//	{ title: 'ID', 				data: '_id', 		readOnly: true, 	type:'text'																					},
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