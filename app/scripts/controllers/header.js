'use strict';

angular.module('trialsReportApp')
  .controller('HeaderCtrl', function ($scope, $location, currentAccount, $sce, locationChanger, $routeParams, snapRemote, $window, $timeout) {

    var controlEl = angular.element(document.querySelector('#controls'));
    var contentEl = angular.element(document.querySelector('#content'));
    if ($scope.screenSize.xs || $scope.screenSize.sm) {
      controlEl.wrap('<div class="snap-drawers"></div>')
        .wrap('<snap-drawer class="snap-drawer snap-drawer-left"></snap-drawer>');
      //contentEl.wrap('<snap-content id="snap-content" style="background-color: #fff" snap-options="snapOpts"></snap-content>');
      //angular.element(document.querySelector('#snap-content')).prepend(
      //  '<snap-dragger>' +
      //    '<button class="btn btn-icon" snap-toggle>' +
      //      '<i class="material-icons">&#xE5D2;</i>' +
      //    '</button>' +
      //  '</snap-dragger>'
      //);
    }

    $scope.mapModal = {
      content: $sce.trustAsHtml(
        '<div class="map-modal">' +
          '<div class="map-modal__heatmap">' +
            '<img class="img-responsive" src="' + $scope.currentMap.heatmapImage + '" alt="Heatmap">' + // todo: handle case where heatmapImage does not exist
          '</div>' +
        '</div>'
      )
    };

    if ($routeParams.playerName) {
      $scope.searchedPlayer = $routeParams.playerName;
    }

    $scope.togglePlatform = function () {
      $scope.platformValue = !$scope.platformValue;
    };

    $scope.searchMainPlayerbyName = function (name) {
      if (angular.isDefined(name)) {
        $location.path(($scope.platformValue ? '/ps/' : '/xbox/') + name);
      } else {
        if (angular.isDefined($scope.searchedPlayer)) {
          $location.path(($scope.platformValue ? '/ps/' : '/xbox/') + $scope.searchedPlayer);
        }
      }
    };

    function updateUrl($scope, locationChanger) {
      if ($scope.fireteam[0] && $scope.fireteam[1] && $scope.fireteam[2]) {
        if ($scope.fireteam[2].membershipId) {
          var platformUrl = $scope.platformValue ? '/ps/' : '/xbox/';
          locationChanger.skipReload()
            .withoutRefresh(platformUrl + $scope.fireteam[0].name + '/' +
            $scope.fireteam[1].name + '/' + $scope.fireteam[2].name, true);
        }
      }
    }

    $scope.searchPlayerbyName = function (player, name, platform, index) {
      if (angular.isUndefined(name)) {
        return;
      }
      var url = '/Platform/Destiny/SearchDestinyPlayer/' + ($scope.platformValue ? 2 : 1) + '/' + name + '/';
      return currentAccount.getAccount(url)
        .then(function (player) {
          player.isTeammate = true;
          currentAccount.getPlayerCard(player).then(function (teammate) {
            $scope.$evalAsync( $scope.fireteam[index] = teammate );
            currentAccount.compareLastMatchResults($scope.fireteam[index], $scope.fireteam[0].activities.lastThree);
            updateUrl($scope, locationChanger)
          });
        });
    };

    $scope.refreshInventory = function (fireteam) {
      angular.forEach(fireteam, function (player, index) {
        currentAccount.refreshInventory($scope.fireteam[index]).then(function (teammate) {
          $scope.$evalAsync($scope.fireteam[index] = teammate);
        });
      });
    };
  });
