define([
  'angular',
],
function (angular) {
  'use strict';

  var module = angular.module('grafana.controllers');

  module.controller('HostsCtrl', function($scope) {

    $scope.init = function() {
      $scope.getHostsInfo();
    };

    $scope.getHostsInfo = function() {
      $scope.regex = "";
    };

    $scope.update = function() {
     // if (!$scope.hostsForm.$valid) { return; }
      var regex = $scope.regex;
      location.href = "/dashboard/script/scripted.js?regex=" + regex;
    };

    $scope.init();

  });
});
