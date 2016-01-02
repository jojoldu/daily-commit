/**
 * Created by jojoldu@gmail.com on 2016-01-02.
 */
angular.module('user')
.filter('not-regist', function(hooksUrl){
    return function(data){
        if(angular.isArray(data)){
            var results = [];

            for(var i=0;i<data.length;i++){
                if(hooksUrl === data.hooks_url){

                }
            }

            return results;
        }else{
            return
        }
    }
});