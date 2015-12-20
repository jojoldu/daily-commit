/**
 * Created by jojoldu@gmail.com on 2015-12-20.
 */

var msg = {
    '404' : '페이지를 찾을 수 없습니다.'
}

exports.getRes = function(code){
    return {
        template : 'error',
        code : code,
        msg : msg[code]
    }
}