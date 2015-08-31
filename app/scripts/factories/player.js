'use strict';

function setPlayerLastMatches(postGame, player) {
  if (postGame && postGame.matchStats[player.id]) {
    player.allStats = postGame.matchStats[player.id].allStats;
    player.recentMatches = postGame.matchStats[player.id].recentMatches;
    player.abilityKills = postGame.matchStats[player.id].abilityKills;
    player.medals = postGame.matchStats[player.id].medals;
    player.weaponsUsed = postGame.matchStats[player.id].weaponsUsed;
    player.fireTeam = postGame.fireTeam;
  }
}
angular.module('trialsReportApp')
  .factory('playerCard', function ($http, currentAccount, inventoryStats, trialsStats, $q) {

    var compareLastMatchResults = function (player, postGameResults) {
      var updateLastMatchResults = function (teammate) {
          teammate.isTeammate = true;
          var lastThree = {};
          angular.forEach(teammate.lastThree, function (match, key) {
              if (postGameResults[key]) {
                lastThree[key] = postGameResults[key];
              } else {
                lastThree[key] = trialsStats.getPostGame(teammate.lastThree[key], teammate);
              }
            });
          return $q.all(lastThree).then(function (result) {
            teammate.lastThree = result;
            return teammate;
          });
      },
      updateMatchStats = function (player) {
        var dfd = $q.defer();
        dfd.resolve(trialsStats.getTeamSummary(player.lastThree, player));

        return dfd.promise.then(function (postGame) {
          setPlayerLastMatches(postGame, player);
        });
      };

      return updateLastMatchResults(player, postGameResults)
        .then(updateMatchStats)
        .catch(reportProblems);
    };

    var setPlayerCard = function (player) {
        var count = player.myProfile ? 250 : 25;
        return currentAccount.getActivities(player, count)
          .then(function (player) {
            return player;
          });
      },
      playerStatsInParallel = function (player) {

        var methods = [
          inventoryStats.getInventory(player.membershipType, player),
          trialsStats.getData(player)
        ];

        if (player.lastThree && !player.isTeammate) {
          methods.push(trialsStats.getLastThree(player));
        }

        return $q.all(methods)
      },
      setPlayerStats = function (result) {
        var dfd = $q.defer();
        var player = result[0], stats = result[1], postGame = result[2];
        setPlayerLastMatches(postGame, player);
        player.noRecentMatches = !player.recentMatches;
        player.stats = stats.stats;
        player.nonHazard = stats.nonHazard;
        player.lighthouse = stats.lighthouse;
        dfd.resolve(player);

        return dfd.promise;
      },
      reportProblems = function (fault) {
        console.log(String(fault));
      };

    var getPlayerCard = function (player) {
      return setPlayerCard(player)
        .then(playerStatsInParallel)
        .then(setPlayerStats)
        .catch(reportProblems);
    };

    var refreshInventory = function (player) {
      return playerStatsInParallel(player)
        .then(setPlayerStats)
        .catch(reportProblems);
    };


    return {
      getPlayerCard: getPlayerCard,
      refreshInventory: refreshInventory,
      compareLastMatchResults: compareLastMatchResults
    };
  });
