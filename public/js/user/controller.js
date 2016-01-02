/**
 * Created by jojoldu@gmail.com on 2015-12-27.
 */

angular.module('user', [])
    .controller('userCtrl', function($scope, $http){
        $scope.init = function(strData){
            $scope.user = JSON.parse(strData);
        }

        $scope.save = function(){
            var checkedRepos = angular.element(document.querySelectorAll(".is-selected"));

            if(checkedRepos.length === 0){
                alert('등록을 원하는 프로젝트를 선택해주세요');
                return;
            }

            if(confirm('해당 프로젝트를 등록하시겠습니까')){
                var data = [];
                for(var i=0;i<checkedRepos.length;i++){
                    data.push(checkedRepos[i].id);
                }

                $http.post('http://localhost/user/repos', data)
                    .then(function(res){
                        if(angular.isArray(res)){
                            console.log(res+'가 실패했습니다.');
                        }else{
                            alert('성공');
                        }
                    }, function(){

                    });
            }
        }
    });