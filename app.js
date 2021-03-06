/**
 * Created by jojoldu@gmail.com on 2015-12-13.
 */

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var url = require('url');
var queryString = require('query-string');
var session = require('express-session');
var app = express();

//datasource 분리
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/devplanet', {native_parser:true});
db.bind('commit');
db.bind('user');

//외부 설정파일로 분리
var domain = 'http://localhost';
var tempDomain = 'http://fd5f9907.ngrok.io/commit';
var clientId = '917614cfb633b397de81',
    clientSecret = 'c69ab2f4c6494be57d28ecb89bb4ce364ce7f29a',
    redirectUri = domain+'/auth';

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'daily commit jojoldu',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7200000 } //2시간
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/user', function(req, res, next){
    if(req.session && req.session.isAuth){
        return next();
    }

    res.redirect('/');
});

app.get('/', function(req, res){
    res.render('index', {msg: 'Hello Daily Commit'});
});

app.get('/user/:name', function(req, res){
    var name = req.params.name,
        sessionUser = req.session.user,
        result={};

    if(name !== sessionUser.login){
        res.redirect('/');
    }

    db.user.findOne({name:name}, function(err, user){
        var accessToken = user.access_token;

        request.get({
            url:'https://api.github.com/users/'+name+'/repos?access_token=' + accessToken,
            headers: {
                'User-Agent': domain
            }}, function(err, response, body){
            if(err || !body){
                console.log('get repos error '+ err);
                res.redirect('/');
            }
            result.info = sessionUser;
            result.repos = JSON.parse(body);
            res.render('user/user', {user : JSON.stringify(result)});
        });
    });
});

app.post('/user/repos', function(req, res){
    var sessionUser = req.session.user,
        repos = req.body,
        accessToken = req.session.accessToken,
        failRepos = [],
        result;

    if(repos.length < 1 || !accessToken){
        res.json(false);
    }

    for(var i=0;i<repos.length;i++){
        //oauth 인증후, access_token으로 저장소 hooks 변경
        result = setHooks(sessionUser.login, repos[i], accessToken);
        if(result !== true){
            failRepos.push(result);
        }

        if(i === repos.length-1){
            res.json(failRepos.length >0? failRepos : true);
        }
    }
 });

function setHooks(userName, repoName, accessToken){
    request({
        url: 'https://api.github.com/repos/'+userName+'/'+repoName+'/hooks?access_token=' + accessToken,
        method: 'POST',
        headers: {
            'User-Agent': domain
        },
        json: {
            "name": "web",
            "active": true,
            "events": [
                "push"
            ],
            "config": {
                "url": tempDomain,
                "content_type": "json",
                "secret":clientSecret
            }
        }
    }, function (error, response) {
        if (!error && response.statusCode == 201) {

            return true;
        } else {
            console.log('set webhooks error : ' + repoName);
            return repoName;
        }
    });
}

app.get('/commit/:name', function(req, res){
    //오류남 해결해야함
    //db.commit.find({id:id}).sort({push_date : -1}).limit(10).toArray(function(err, commits){
    //    var result = {
    //        commits : commits
    //    }
    //    if(commits.length === 0){
    //        var error = errorUtil.getRes(404);
    //        res.render(error.template, error.msg);
    //    }
    //
    //    res.render('profile', result);
    //});
});



app.get('/auth', function(req, res){
    var code = req.query.code;
    request.post('https://github.com/login/oauth/access_token',
        { form : {
            client_id:clientId,
            client_secret:clientSecret,
            code:code,
            redirect_uri:redirectUri
        }},

        function(err, response, body) {
            var queryData = queryString.parse(body);
            var accessToken = queryData.access_token;
            if (!accessToken) {
                console.log('access_token is ' + accessToken);
                res.redirect(domain);
            }
            request.get({
                url:'https://api.github.com/user?access_token=' + accessToken,
                headers: {
                    'User-Agent': domain
                }
            }, function (error, response, body) {
                if(!error && response.statusCode == 200){
                    var user = JSON.parse(body);
                    //DB에 회원정보 존재여부 비교해서 저장
                    db.user.update(
                        {id:user.id},
                        {
                            id:user.id,
                            name:user.login,
                            access_token:accessToken
                        },
                        {upsert:true},
                        function(err, result, next){
                            if(err){
                                console.log('user upsert error : ', err);
                                next();
                            }else{
                                req.session.isAuth = true;
                                req.session.user = user;
                                req.session.accessToken = accessToken;
                                res.redirect('/user/'+user.login);
                            }
                        });

                }else{
                    console.log('get user info error');
                    res.redirect('/');
                }
            });
        }
    )
});

app.post('/commit', function(req, res){
    var body = req.body;
    var commit={
        name : body.sender.login,
        id : body.sender.id,
        repository : {
            name : body.repository.name,
            url : body.repository.url,
            description : body.repository.description
        },
        push_date : body.pushed_at,
        commits : body.commits
    };

    db.commit.insert(commit, function(err){
        if(err) {
            return console.log('insert error', err);
        }
        res.json(true);
    });
});

app.post('/repo', function(req, res){

});

app.listen(80);
console.log('Express Listening on port 80...');