/**
 * Created by jojoldu@zuminternet.com on 2015-12-17.
 */
var assert = require('assert');
var seedCommit = require('./commit.json');
var superagent = require('superagent');
var expect = require('expect.js');

it('save', function(done){
    superagent.get('http://localhost:80')
        .end(function(res){
            var commits = seedCommit.commits;
            commits.forEach(function(commit, index, list){
                expect(res.text).to.contain('<h2><li>'+commit.message+'</li>');
                console.log(commit.message);
            });
        done();
        });
});