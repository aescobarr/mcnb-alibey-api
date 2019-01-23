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
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
      .get('/auth')
      .query({ user: config.test_user_name, pwd: config.test_user_pwd })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        token = res.body.token;
        done();
      });
  });

  it('Obtains 20 toponims', function(done) {
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
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
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
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
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
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
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
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

  it('tipus toponims list, no parameters', function(done) {
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)      
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 33);
        assert.equal(res.body.records[0].nom, 'accident geogràfic');
        done();
      });
  });

  it('tipus toponims list, limited results', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ results: 20 })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 20);
        done();
      });
  });

  it('tipus toponims list, ordered list asc', function(done) {
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ dir: 'asc' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records[0].nom, 'accident geogràfic');        
        done();
      });
  });    

  it('tipus toponims list, ordered list desc', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ dir: 'desc' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records[0].nom, 'tribal, àrea');
        done();
      });
  });

  it('tipus toponims list, ordered list desc limit results', function(done) {
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ dir: 'desc', results: 10 })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records[0].nom, 'tribal, àrea');
        assert.equal(res.body.records.length, 10);
        done();
      });
  });
});

describe('GET /toponim', function() {
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

  it('Complete toponim by id', function(done) {
    chai.request('http://127.0.0.1:' + config.running_port || '8080' + '/api')
      .get('/toponim')
      .set('x-access-token', token)
      .query({ id: '544552524553545245434F4E492020494C4C41436F6E696C6C6572612C20696C6C6120736130372F31312F32303036' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 1);
        assert.equal(res.body.records[0].nomtoponim, 'Conillera, illa sa');        
        done();
      });
  });

  it('Complete toponim by id, multiple ids', function(done) {
    chai.request('http://127.0.0.1:8080/api')
      .get('/toponim')
      .set('x-access-token', token)
      .query({ id: '544552524553545245434F4E492020494C4C41436F6E696C6C6572612C20696C6C6120736130372F31312F32303036,54455252455354524530383138375361626164656C6C32322F30392F32303036,544552524553545245303831393753616E7420416E64726575206465204C6C6176616E6572657331352F31312F32303036' })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 3);
        assert.equal(res.body.records[0].nomtoponim, 'Sant Andreu de Llavaneres');
        assert.equal(res.body.records[1].nomtoponim, 'Sabadell');
        assert.equal(res.body.records[2].nomtoponim, 'Conillera, illa sa');
        done();
      });
  });

  
});
