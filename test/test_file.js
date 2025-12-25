'use strict';

process.env.NODE_ENV = 'test';

require('../app.js');

var chai = require('chai');
var chaiHttp = require('chai-http');
const moment = require('moment');
var assert = require('assert');
const { func } = require('joi');
var expect = chai.expect;

chai.use(chaiHttp);

describe('GET /version', function(){
  it('checks rate limiting header is there', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/version')            
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.header('ratelimit-policy');        
        done();
      });
  });
  it('checks rate limit policy value is correct', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/version')            
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        assert.equal(res.headers['ratelimit-limit'], '200');
        done();
      });
  });
})

describe('GET /toponimspartnom', function() {
  var token = '';

  it('authenticates and obtains a valid json web token', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/auth')
      .query({ user: process.env.TEST_USER_NAME, pwd: process.env.TEST_USER_PWD })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }        
        expect(res).to.have.status(200);
        token = res.body.token;
        done();
      });
  });


  it('obtains 20 toponims', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 20 })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 20);
        done();
      });
  });


  it('obtains 20 toponims, ordered desc', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 20, dir: 'desc' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 20);        
        const name_0 = res.body.records[0].nomtoponim;
        const name_1 = res.body.records[1].nomtoponim;
        assert((name_0).localeCompare(name_1) > 0, 'Ordering not correct, ' + name_0 + ' should be before ' + name_1);
        done();
      });
  });


  it('obtains 20 toponims, ordered desc, partial name match', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 20, dir: 'desc', query: 'aba' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert(res.body.records.length > 0, 'Query string "aba" should return some results, returns none');
        var finished = false;
        var keeps_ordering = false;
        var index = 0;        
        var nom_1;
        var nom_2;
        while(!finished){
          var index_second_element = index + 1;
          if(index_second_element == res.body.records.length){            
            break;
          }
          nom_1 = res.body.records[index].nomtoponim;
          nom_2 = res.body.records[index_second_element].nomtoponim;

          keeps_ordering = (nom_1).localeCompare(nom_2) >= 0;
          if(!keeps_ordering){
            break;
          }
          index = index + 1;
          if(index > res.body.records.length){
            finished = true;
          }
        }        
        assert(keeps_ordering, 'Ordering not correct, ' + nom_1 + ' should be before ' + nom_2);
        done();
      });
  });

  it('obtains 40 toponims, ordered asc by date', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 40, dir: 'asc', sort: 'data' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 40);
        var finished = false;
        var keeps_ordering = false;
        var index = 0;        
        var date_1;
        var date_2;
        while(!finished){
          var index_second_element = index + 1;
          if(index_second_element == res.body.records.length){            
            break;
          }
          date_1 = moment(res.body.records[index].datacaptura);
          date_2 = moment(res.body.records[index_second_element].datacaptura);

          keeps_ordering = date_1.isSameOrBefore(date_2);
          if(!keeps_ordering){
            break;
          }
          index = index + 1;
          if(index > res.body.records.length){
            finished = true;
          }
        }
        assert(keeps_ordering == true, 'Ordering is not kept, date_1 ' + date_1 + ' is not same or before ' + date_2);
        done();
      });
  });

  it('obtains 40 toponims, ordered desc by aquatic', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 40, dir: 'desc', sort: 'aquatic' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 40);
        var finished = false;
        var keeps_ordering = false;
        var index = 0;        
        var aquatic_1;
        var aquatic_2;
        while(!finished){
          var index_second_element = index + 1;
          if(index_second_element == res.body.records.length){            
            break;
          }
          aquatic_1 = res.body.records[index].aquatic;
          aquatic_2 = res.body.records[index_second_element].aquatic;

          keeps_ordering = aquatic_1 == aquatic_2;
          if(!keeps_ordering){
            break;
          }
          index = index + 1;
          if(index > res.body.records.length){
            finished = true;
          }
        }
        assert(keeps_ordering, 'Consecutive records should both be aquatic');
        done();
      });
  });

  it('obtains 40 toponims, by toponim type (ocean)', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 40, idtipus: 'furibe84606125209773342800' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert(res.body.records.length > 0, 'Ocean should return results');        
        done();
      });
  });

  it('obtains 2 toponims, default sort', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponimspartnom')
      .set('x-access-token', token)
      .query({ results: 2, startIndex: 0 })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 2);        
        const nom_1 = res.body.records[0].nomtoponim;
        const nom_2 = res.body.records[1].nomtoponim;
        assert((nom_1).localeCompare(nom_2) >= 0, 'Ordering not correct, ' + nom_1 + ' should be before ' + nom_2);
        done();
      });
  });

});


describe('GET /tipustoponim', function() {
  var token = '';

  it('authenticates and obtains a valid json web token', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/auth')
      .query({ user: process.env.TEST_USER_NAME, pwd: process.env.TEST_USER_PWD })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        token = res.body.token;
        done();
      });
  });

  it('obtains tipus toponims list, no parameters', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        const nom_1 = res.body.records[0].nom;
        const nom_2 = res.body.records[1].nom;
        assert((nom_1).localeCompare(nom_2) <= 0, 'Ordering not correct, ' + nom_1 + ' should be before ' + nom_2);
        done();
      });
  });

  it('obtains tipus toponims list, limited results', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ results: 20 })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 20);
        done();
      });
  });

  it('obtains tipus toponims list, ordered list asc', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ dir: 'asc' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records[0].nom, 'accident geogràfic');
        done();
      });
  });

  it('obtains tipus toponims list, ordered list desc', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ dir: 'desc' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records[0].nom, 'tribal, àrea');
        done();
      });
  });

  it('obtains tipus toponims list, ordered list desc limit results', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/tipustoponim')
      .set('x-access-token', token)
      .query({ dir: 'desc', results: 10 })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
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
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/auth')
      .query({ user: process.env.TEST_USER_NAME, pwd: process.env.TEST_USER_PWD })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        token = res.body.token;
        done();
      });
  });

  it('obtains complete toponim by id', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponim')
      .set('x-access-token', token)
      .query({ id: '544552524553545245434F4E492020494C4C41436F6E696C6C6572612C20696C6C6120736130372F31312F32303036' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.totalRecords, 1);
        assert.equal(res.body.nomToponim, 'Conillera, illa sa');
        done();
      });
  });

  it('obtains complete toponim by id, multiple ids', function(done) {
    chai.request('http://127.0.0.1:' + (process.env.RUNNING_PORT || '8080') + '/api')
      .get('/toponim')
      .set('x-access-token', token)
      .query({ id: '544552524553545245434F4E492020494C4C41436F6E696C6C6572612C20696C6C6120736130372F31312F32303036,54455252455354524530383138375361626164656C6C32322F30392F32303036,544552524553545245303831393753616E7420416E64726575206465204C6C6176616E6572657331352F31312F32303036' })
      .end(function(err, res) {
        if (err) {
          console.log(err.stack);
        }
        expect(res).to.have.status(200);
        assert.equal(res.body.records.length, 3);        
        done();
      });
  });
});
