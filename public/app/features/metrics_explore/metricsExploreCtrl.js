define([
  'angular',
  '../../core/core_module',
],
function (angular, coreModule) {
  'use strict';

  coreModule.default.controller('MetricsExploreCtrl', function($scope, $sce, $routeParams, contextSrv, backendSrv, $location) {
    $scope.init = function() {
      if ($routeParams.query) {
        $scope.query = $routeParams.query;
        $scope.update();
      }
    };

    $scope.update = function() {
      $scope.showResults = true;
      $scope.searching = true;
      var query = $scope.query;
      var matches = [];
      backendSrv.get('/api/metrics/explore', {query: query}).then(function(result) {
        angular.forEach(result, function(value, key) {
          matches.push($scope.highlight(value, query));
        });
        $scope.result = matches;
        $location.path('/explore').search({query: query});
        $scope.searching = false;
      });
    };

    $scope.highlight = function(text, search) {
      if (!search) {
        return $sce.trustAsHtml(text);
      }
      return $sce.trustAsHtml(text.replace(new RegExp(search, 'g'), '<span style="background: #e6aa00; color: #333333">$&</span>'));
    };

    $scope.init();

  });
});
