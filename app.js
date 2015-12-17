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
var db = mongo.db('mongodb://localhost:27017/devplanet', {native_parser:true});
var domain = 'http://localhost:80';
var app = express();

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

app.get('/auth', function(req, res){
    var code = req.query.code,
        clientId = '917614cfb633b397de81',
        clientSecret = 'c69ab2f4c6494be57d28ecb89bb4ce364ce7f29a',
        redirectUri = domain+'/auth';

    request.post('https://github.com/login/oauth/access_token',
                { form : {
                    client_id:clientId,
                    client_secret:clientSecret,
                    code:code,
                    redirect_uri:redirectUri
                }},

                function(err, response, body){
                    var queryData = queryString.parse(body);
                    var accessToken = queryData.access_token;
                    if(!accessToken){
                        console.log('access_token is '+accessToken);
                        res.redirect(domain);
                    }
                    request.get({
                                url:'https://api.github.com/user?access_token=' + accessToken,
                                headers: {
                                    'User-Agent': domain
                                }
                    }, function (error, response, body) {
                        if(!error && response.statusCode == 200){
                            req.session.isAuth = true;
                            req.session.user = JSON.parse(body);
                            res.redirect('/github');
                        }else{
                            console.log('get user info error');
                            res.redirect('/');
                        }
                    });
        }
    )
});

app.get('/github', function(req, res){
    var userInfo = req.session.user;
    res.render('github',userInfo);
});

app.post('/payload', function(req, res){
    var body = req.body;

    var payload={
        idx : body.sender.id,
        name : body.pusher.name,
        email : body.pusher.email,
        repository : {
            name : body.repository.name,
            url : body.repository.url,
            description : body.repository.description
        },
        commits : body.commits
    }

    //db.save();

    return next();
});


app.listen(80);
console.log('Express Listening on port 8080...');