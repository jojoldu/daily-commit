/**
 * Created by jojoldu@zuminternet.com on 2015-12-17.
 */
var assert = require('assert');
var seedCommit = require('./commit.json');
var mongo = require('mongoskin');

describe('mongo', function(){
    var db;

    before(function(done){
        console.log('before');
        db = mongo.db('mongodb://localhost:27017/devplanet', {native_parser:true});
        db.bind('commits');
        done();
    });

    describe('save', function(){
       it('commits save', function(done){
           var body = seedCommit;
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
               console.log('insert commit');
               done();
           });

           done();
       });
    });
});

