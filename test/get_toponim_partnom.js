'use strict';

process.env.NODE_ENV = 'test';

require('../app.js');

var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var assert = require('assert');
var expect = chai.expect;
var config = require('../config.js').get(process.env.NODE_ENV);

chai.use(chaiHttp);

describe('GET /toponimspartnom', function() {
  var token = '';
  it('authenticates and obtains a valid json web token', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/auth')
      .query({ user: config.test_user_name, pwd: config.test_user_pwd })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        token = res.body.token;
        done();
      });
  });

  it('Obtains 20 toponims', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponimspartnom')
      .set('x-access-token',token)
      .query({ results: 20 })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 20);
        done();
      });
  });

  it('Obtains 20 toponims, ordered desc', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 20, dir: 'desc' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 20);
        assert.equal(res.body.records[0].nomtoponim, 'Zurgena');
        done();
      });
  });

  it('Obtains 20 toponims, ordered desc, partial name match', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 20, dir: 'desc', query: 'urgen' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 1);
        assert.equal(res.body.records[0].nomtoponim, 'Zurgena');
        done();
      });
  });

  it('Obtains 40 toponims, ordered desc by date', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 40, dir: 'desc', sort: 'data' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 40);
        assert.equal(res.body.records[0].nomtoponim, 'la Salut');
        done();
      });
  });

  it('Obtains 40 toponims, ordered desc by aquatic', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 40, dir: 'desc', sort: 'aquatic' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 40);
        assert.equal(res.body.records[0].nomtoponim, 'Port Lligat');
        done();
      });
  });

  it('Obtains 40 toponims, by toponim type (ocean)', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 40, idtipus: 'furibe84606125209773342800' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 1);
        assert.equal(res.body.records[0].nomtoponim, 'Pacífic, oceà');
        done();
      });
  });

  it('40 toponims, default sort', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 40, startIndex: 40 })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 40);
        assert.equal(res.body.records[0].nomtoponim, 'Ain Leuh');
        done();
      });
  });

});

describe('GET /tipustoponim', function() {
  var token = '';
  it('authenticates and obtains a valid json web token', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/auth')
      .query({ user: config.test_user_name, pwd: config.test_user_pwd })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        token = res.body.token;
        done();
      });
  });

  it('40 toponims, default sort', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/tipustoponim')
      .set('x-access-token', token)      
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 33);
        assert.equal(res.body.records[0].nom, 'accident geogràfic');
        done();
      });
  });
});
