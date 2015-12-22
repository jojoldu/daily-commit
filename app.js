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
var mongo = require('mongoskin');
var errorUtil = require('./app/util/error-utils');
var db = mongo.db('mongodb://localhost:27017/devplanet', {native_parser:true});
db.bind('commits');
var app = express();
var domain = 'http://localhost';


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'daily commit jojoldu',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.all('/github', function(req, res, next){
    if(req.session && req.session.isAuth){
        next();
        return;
    }

    res.redirect('/');
});

app.get('/', function(req, res){
    res.render('index', {msg: 'Hello Daily-Commit Project'});
});

app.get('/profile/:id', function(req, res){
    var id = req.params.id;
    res.render('profile', id);
    
    //오류남 해결해야함
    //db.commits.find({id:id}).sort({push_date : -1}).limit(10).toArray(function(err, commits){
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
var clientId = '917614cfb633b397de81',
    clientSecret = 'c69ab2f4c6494be57d28ecb89bb4ce364ce7f29a',
    redirectUri = domain+'/auth';

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
                            req.session.isAuth = true;
                            req.session.user = user;
                            res.redirect('/profile/'+user.login);
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
        id : body.sender.login,
        idx : body.sender.id,
        name : body.pusher.name,
        email : body.pusher.email,
        repository : {
            name : body.repository.name,
            url : body.repository.url,
            description : body.repository.description
        },
        push_date : body.pushed_at,
        commits : body.commits
    }

    db.commits.insert(commit, function(err){
        if(err) {
            return console.log('insert error', err);
        }
    });
});

app.post('/repo', function(req, res){
    ////oauth 인증후, access_token으로 저장소 hooks 변경
    //request({
    //    url: 'https://api.github.com/repos/jojoldu/nodejs/hooks?access_token=' + accessToken,
    //    method: 'POST',
    //    headers: {
    //        'User-Agent': domain
    //    },
    //    json: {
    //        "name": "web",
    //        "active": true,
    //        "events": [
    //            "push"
    //        ],
    //        "config": {
    //            "url": "http://localhost/commit",
    //            "content_type": "json",
    //            "secret":clientSecret
    //        }
    //    }
    //}, function (error, response, body) {
    //    if (!error && response.statusCode == 201) {
    //        var result = JSON.parse(body);
    //        console.log(result);
    //        next();
    //    } else {
    //        console.log('get user info error');
    //        res.redirect('/');
    //    }
    //});
});

app.listen(80);
console.log('Express Listening on port 80...');