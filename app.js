/**
 * Created by jojoldu@gmail.com on 2015-12-13.
 */

var express = require('express');
var path = require('path');
var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res){
    res.render('index', {msg: 'Hello Daily-Commit Project'});
});

app.listen(8080);
console.log('Express Listening on port 8080...');