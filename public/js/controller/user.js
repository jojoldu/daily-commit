/**
 * Created by jojoldu@gmail.com on 2015-12-27.
 */

angular.module('user', [])
.controller('userCtrl', function($scope){
    $scope.init = function(strData){
        $scope.user = JSON.parse(strData);
    }
});