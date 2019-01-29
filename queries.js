'use strict';

var promise = require('bluebird');
var jwt = require('jsonwebtoken');
// var config = require('./config.js');
var config = require('./config.js').get(process.env.NODE_ENV);
var squel = require('squel');
var util = require('util');
var moment = require('moment');
var val = require('./validators.js');
var Joi = require('joi');
var fs = require('fs');


var options = {
  // Initialization Options
  promiseLib: promise,
};

var pgp = require('pg-promise')(options);

// var QueryResultError = pgp.errors.QueryResultError;
var qrec = pgp.errors.queryResultErrorCode;


var cn = {
  host: config.database_host,
  port: config.database_port,
  database: config.database_name,
  user: config.database_user,
  password: config.database_password,
};

var db = pgp(cn);

function getToponim(req, res, next) {

  var params = req.query;
  var id = params.id;
  var single_id, multiple_id;

  var validate = Joi.validate(req.query, val.getToponimsValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  if (id.indexOf(',') === -1){
    single_id = id;
  } else {
    var multiple_id_array = id.split(',');
    multiple_id = "'" + multiple_id_array.join('\',\'') + "'";
  }

  var squelPostgres = squel.useFlavour('postgres');
  var q = squelPostgres.select().from('toponims_api');
  var q_versions = squelPostgres.select().from('toponimsversio_api');

  if (single_id){
    q.where(util.format("id = '%s'", single_id));
    q_versions.where(util.format("idtoponim = '%s'", single_id));
  } else if (multiple_id){
    q.where(util.format('id in (%s)', multiple_id));
    q_versions.where(util.format('idtoponim in (%s)', multiple_id));
  }

  q.field('id')
    .field('nomtoponim')
    .field('nom')
    .field('aquatic')
    .field('tipus');

  var versions_map = {};

  db.any(q_versions.toString())
    .then(function(data) {
      for (var i = 0; i < data.length; i++){
        var elem = data[i];
        if (versions_map[elem.idtoponim] == null){
          versions_map[elem.idtoponim] = [];
        }
        versions_map[elem.idtoponim].push(elem);
      }
    })
    .catch(function(err) {
      return next(err);
    });

  db.any(q.toString())
    .then(function(data) {
      var original_data_json = JSON.stringify(data);
      var data_copy = JSON.parse(original_data_json);
      for (var i = 0; i < data_copy.length; i++){
        var elem = data_copy[i];
        elem.versions = versions_map[elem.id];
      }
      res.status(200)
        .json({
          totalRecords: data_copy.length,
          success: true,
          recordsReturned: data_copy.length,
          records: data_copy,
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function getTipusToponims(req, res, next) {

  var params = req.query;
  var dir = params.dir;
  var results = params.results;
  var startIndex = params.startIndex;
  var totalRecords = 0;

  var validate = Joi.validate(req.query, val.getTipusToponimValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  var squelPostgres = squel.useFlavour('postgres');
  var q = squelPostgres.select()
    .from('tipustoponim', 't');
  var q_count = q.clone().field('count(*)');

  q.field('id')
    .field('nom');

  db.one(q_count.toString())
    .then(function(data) {
      totalRecords = parseInt(data.count, 10);
    })
    .catch(function(err) {
      console.log(err);
    });

  if (dir === 'desc'){
    q.order('nom', false);
  } else if (dir === 'asc') {
    q.order('nom');
  } else {
    q.order('nom');
  }

  if (results && !isNaN(parseInt(results, 10))){
    q.limit(parseInt(results, 10));
  }

  if (startIndex && !isNaN(parseInt(startIndex, 10))){
    q.offset(parseInt(startIndex, 10));
  }

  db.any(q.toString())
    .then(function(data) {
      res.status(200)
        .json({
          totalRecords: totalRecords,
          success: true,
          recordsReturned: data.length,
          startIndex: startIndex,
          dir: dir,
          records: data,
        });
    })
    .catch(function(err) {
      return next(err);
    });
}


function getToponimsPartNom(req, res, next) {

  var params = req.query;
  var sort = params.sort;
  var sort_translation = {
    nom: 'nom',
    aquatic: 'aquatic',
    tipus: 'idtipustoponim',
    data: 'datacaptura',
  };
  var dir = params.dir;
  var idtipus = params.idtipus;
  var results = params.results;
  var startIndex = params.startIndex;
  var query = params.query;
  var totalRecords = 0;

  var validate = Joi.validate(req.query, val.getToponimsPartNomValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  var squelPostgres = squel.useFlavour('postgres');

  var q = squelPostgres.select()
    .from('toponims_api', 't');
  var q_count = q.clone().field('count(*)');

  q.field('id')
    .field('nomtoponim')
    .field('nom')
    .field('aquatic')
    .field('tipus')
    .field('idtipus')
    .field('datacaptura')
    .field('coordenadaxcentroide')
    .field('coordenadaycentroide')
    .field('incertesa');

  if (!sort){
    sort = 'nom';
  }

  if (sort){
    if (dir){
      if (dir === 'asc'){
        q.order(sort_translation[sort]);
      } else {
        q.order(sort_translation[sort], false);
      }
    } else {
      q.order(sort_translation[sort]);
    }
  }

  if (idtipus){
    q.where('idtipus = ?', idtipus);
  }

  if (results && !isNaN(parseInt(results, 10))){
    q.limit(parseInt(results, 10));
  }

  if (startIndex && !isNaN(parseInt(startIndex, 10))){
    q.offset(parseInt(startIndex, 10));
  }

  if (query){
    q.where('nom ilike ?', '%' + query + '%');
  }

  db.one(q_count.toString())
    .then(function(data_count) {
      totalRecords = parseInt(data_count.count, 10);
      db.any(q.toString())
        .then(function(data) {
          res.status(200)
            .json({
              totalRecords: totalRecords,
              success: true,
              recordsReturned: data.length,
              startIndex: startIndex,
              dir: dir,
              sort: sort,
              records: data,
            });
        })
        .catch(function(err) {
          return next(err);
        });
    })
    .catch(function(err) {
      console.log(err);
    });
}

function getArbre(req, res, next) {
  var params = req.query;
  var _root = params.root;
  var _max_depth = params.max_depth;

  var validate = Joi.validate(req.query, val.getArbreValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  var squelPostgres = squel.useFlavour('postgres');

  var q = squelPostgres.select()
    .from('toponim', 't')
    .join('toponims_api', 'ta', 't.id = ta.id')
    .where(
      't.denormalized_toponimtree ilike ? or t.id=?',
      '%' + _root + '%', _root
    )
    .order('length(denormalized_toponimtree)', false)
    .order('t.nom');

  q.field('ta.*')
    .field('t.denormalized_toponimtree');

  console.log(q.toString());

  db.any(q.toString())
    .then(function(data) {
      var original_data_json = JSON.stringify(data);
      var data_copy = JSON.parse(original_data_json);
      var data_cleaned = [];
      var referenced_copy = {};
      var root_element = { records: {} };
      var i;
      var elem;
      
      for (i = 0; i < data_copy.length; i++){
        elem = data_copy[i];
        var tree_depth;
        if( elem.denormalized_toponimtree.split('#').length == 1 && elem.denormalized_toponimtree.length == 0){          
          tree_depth = 0;
        }else{
          tree_depth = elem.denormalized_toponimtree.split('#').length;
        }
        if ( _max_depth == null || tree_depth <= _max_depth ){
          data_cleaned.push(elem);
        }
      }

      for (i = 0; i < data_cleaned.length; i++){
        elem = data_cleaned[i];
        elem.fills = [];
        referenced_copy[elem.id] = elem;        
      }

      for (i = 0; i < data_cleaned.length; i++){
        elem = data_cleaned[i];
        var parent_element_tuple = elem.denormalized_toponimtree.split('#')[ elem.denormalized_toponimtree.split('#').length - 1 ];
        var parent_id = parent_element_tuple.split('$')[0];
        delete elem.denormalized_toponimtree;
        if (referenced_copy[parent_id]){
          referenced_copy[parent_id].fills.push(elem);
        } else {
          root_element = elem;
        }        
      }

      /*
      for (i = 0; i < data_copy.length; i++){
        elem = data_copy[i];
        elem.fills = [];
        referenced_copy[elem.id] = elem;        
      }

      for (i = 0; i < data_copy.length; i++){
        elem = data_copy[i];        
        var parent_element_tuple = elem.denormalized_toponimtree.split('#')[ elem.denormalized_toponimtree.split('#').length - 1 ];
        var parent_id = parent_element_tuple.split('$')[0];
        delete elem.denormalized_toponimtree;
        if (referenced_copy[parent_id]){
          referenced_copy[parent_id].fills.push(elem);
        } else {
          root_element = elem;
        }        
      }*/
      res.status(200)
        .json({
          records: root_element,
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function getToponimsGeo(req, res, next) {
  var params = req.query;
  var wkt = params.wkt;

  var validate = Joi.validate(req.query, val.getToponimsGeoValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  var squelPostgres = squel.useFlavour('postgres');

  var q = squelPostgres.select()
    .from('toponims_api', 't')
    .from('geometries_api', 'g')
    .where('t.id = g.id')
    .where('ST_WITHIN(geometria, ST_GeomFromText(?,4326))', wkt)
    .field('t.id')
    .field('t.nomtoponim')
    .field('t.nom')
    .field('t.aquatic')
    .field('t.tipus')
    .field('t.datacaptura')
    .field('t.coordenadaxcentroide')
    .field('t.coordenadaycentroide')
    .field('t.incertesa');

  console.log(q.toString());

  db.any(q.toString())
    .then(function(data) {
      res.status(200)
        .json({
          totalRecords: data.length,
          success: true,
          message: 'OK',
          records: data,
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function postComment(req, res, next) {

  var params = req.query;
  var idversio = params.idversio;
  var comment = params.comment;
  var date_s = params.date;
  var date_date;
  var author = params.author;
  var file = req.file;

  var validate = Joi.validate(req.query, val.getNewCommentValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  if (!date_s){
    date_date = moment().toDate();
  } else {
    var parsed_moment = moment(date_s, 'DD/MM/YYYY HH:mm:ss', true);
    if (!parsed_moment.isValid()){
      return res.status(403).send({
        success: false,
        message: 'Invalid date format, must be DD/MM/YYYY HH:mm:ss',
      });
    }
    date_date = parsed_moment.toDate();
  }

  var squelPostgres = squel.useFlavour('postgres');
  var q_versio = squelPostgres.select()
    .from('toponimsversio_api')
    .where('id = ?', idversio)
    .field('id')
    .field('nom')
    .field('nomtoponim')
    .field('tipus')
    .field('versio')
    .field('qualificadorversio')
    .field('recurscaptura')
    .field('sistrefrecurs')
    .field('datacaptura')
    .field('coordxoriginal')
    .field('coordyoriginal')
    .field('coordz')
    .field('incertesaz')
    .field('georeferenciatper')
    .field('observacions')
    .field('coordxcentroide')
    .field('coordycentroide')
    .field('incertesacoord');

  var q_insert = squelPostgres.insert()
    .into('comments')
    .set('comment', comment)
    .set(
      'data',
      "to_timestamp('" +
      date_date.toISOString() +
      "','YYYY-MM-DD HH24:MI:SS')",
      {dontQuote: true}
    )
    .set('author', author)
    .set('idversio', idversio);

  if (file && file.originalname){
    q_insert.set('nom_original', file.originalname);
  }

  if (file && file.path){
    q_insert.set('attachment', file.path);
  }


  db.one(q_versio.toString())
    .then(function(data) {
      db.one(q_insert.toString() + ' RETURNING *')
        .then(function(insert_data) {
          res.status(200)
            .json({
              date: insert_data.data,
              totalRecords: 1,
              attachment: insert_data.attachment,
              author: insert_data.author,
              versio: data,
              success: true,
              comment: insert_data.comment,
              id: insert_data.id,
              message: 'OK',
              nom_original: insert_data.nom_original,
            });
        })
        .catch(function(err) {
          return next(err);
        });
    })
    .catch(function(err) {
      return next(err);
    });
}


function editComment(req, res, next) {

  var params = req.query;
  var idcomment = params.idcomment;
  var comment = params.comment;
  var date_s = params.date;
  var date_date;
  var author = params.author;
  var file = req.file;

  var validate = Joi.validate(req.query, val.getExistingCommentValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  if (!date_s){
    date_date = moment().toDate();
  } else {
    var parsed_moment = moment(date_s, 'DD/MM/YYYY HH:mm:ss', true);
    if (!parsed_moment.isValid()){
      return res.status(403).send({
        success: false,
        message: 'Invalid date format, must be DD/MM/YYYY HH:mm:ss',
      });
    }
    date_date = parsed_moment.toDate();
  }

  var squelPostgres = squel.useFlavour('postgres');
  var q_versio = squelPostgres.select()
    .from('toponimsversio_api')
    .where(
      'id = ?',
      squelPostgres.select()
        .from('comments')
        .where('id=?', idcomment)
        .field('idversio')
    )
    .field('id')
    .field('nom')
    .field('nomtoponim')
    .field('tipus')
    .field('versio')
    .field('qualificadorversio')
    .field('recurscaptura')
    .field('sistrefrecurs')
    .field('datacaptura')
    .field('coordxoriginal')
    .field('coordyoriginal')
    .field('coordz')
    .field('incertesaz')
    .field('georeferenciatper')
    .field('observacions')
    .field('coordxcentroide')
    .field('coordycentroide')
    .field('incertesacoord');

  var q_update = squelPostgres.update()
    .table('comments')
    .set('comment', comment)
    .set(
      'data',
      "to_timestamp('" +
      date_date.toISOString() +
      "','YYYY-MM-DD HH24:MI:SS')",
      {dontQuote: true}
    )
    .set('author', author)
    .where('id = ?', idcomment);

  if (file && file.originalname){
    q_update.set('nom_original', file.originalname);
  }

  if (file && file.path){
    q_update.set('attachment', file.path);
  }


  db.one(q_versio.toString())
    .then(function(data) {
      db.one(q_update.toString() + ' RETURNING *')
        .then(function(update_data) {
          res.status(200)
            .json({
              date: update_data.data,
              totalRecords: 1,
              attachment: update_data.attachment,
              author: update_data.author,
              versio: data,
              success: true,
              comment: update_data.comment,
              id: update_data.id,
              message: 'OK',
              nom_original: update_data.nom_original,
            });
        })
        .catch(function(err) {
          return next(err);
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function deleteComment(req, res, next) {
  var params = req.query;
  var idcomment = params.idcomment;

  var validate = Joi.validate(req.query, val.getDeleteCommentValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  var squelPostgres = squel.useFlavour('postgres');
  var q_delete = squelPostgres.delete()
    .from('comments')
    .where('id = ?', idcomment);

  db.one(q_delete.toString() + ' RETURNING *')
    .then(function(delete_data) {
      var file_name = delete_data.attachment;
      fs.unlink(file_name, function(err){
        if (err){
          res.status(500).json({
            success: false,
            message: err,
          });
        }
        res.status(200).json({
          totalRecords: 1,
          success: true,
          message: 'OK',
        });
      });
    })
    .catch(function(err) {
      return next(err);
    });
}

function getComment(req, res, next) {
  var params = req.query;
  var sort = params.sort;
  var sort_translation = {
    comment: 'c.comment',
    commentTimestamp: 'c.data',
    nomOriginal: 'c.nom_original',
    attachment: 'c.attachment',
    author: 'c.author',
  };
  var dir = params.dir;
  var idversio = params.idversio;
  var id = params.id;
  var results = params.results;
  var startIndex = params.startIndex;
  var totalRecords = 0;

  var validate = Joi.validate(req.query, val.getCommentValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  var squelPostgres = squel.useFlavour('postgres');

  var q_select = squelPostgres.select()
    .from('comments', 'c')
    .from('toponimsversio_api', 't')
    .where('t.id = c.idversio');

  var q_count = q_select.clone().field('count(*)');

  q_select.field('c.id', 'id_comment')
    .field('c.comment')
    .field('c.data')
    .field('c.attachment')
    .field('c.nom_original')
    .field('c.author')
    .field('t.*');

  if (id){
    q_select.where('c.id = ?', id);
  } else {
    if (idversio){
      q_select.where('t.id = ?', idversio);
    }
  }

  if (sort){
    if (dir){
      if (dir === 'asc'){
        q_select.order(sort_translation[sort]);
      } else {
        q_select.order(sort_translation[sort], false);
      }
    } else {
      q_select.order(sort_translation[sort]);
    }
  }

  if (results && !isNaN(parseInt(results, 10))){
    q_select.limit(parseInt(results, 10));
  }

  if (startIndex && !isNaN(parseInt(startIndex, 10))){
    q_select.offset(parseInt(startIndex, 10));
  }

  db.one(q_count.toString())
    .then(function(data_count) {
      totalRecords = parseInt(data_count.count, 10);
      db.any(q_select.toString())
        .then(function(data) {
          var data_copy = [];
          for (var i = 0; i < data.length; i++){
            var elem = data[i];
            data_copy.push({
              date: elem.data,
              attachment: elem.attachment,
              author: elem.author,
              versio: {
                coordXOriginal: elem.coordxoriginal,
                coordYOriginal: elem.coordyoriginal,
                recursCaptura: elem.recurscaptura,
                versio: elem.versio,
                observacions: elem.observacions,
                qualificadorVersio: elem.qualificadorversio,
                sistRefRecurs: elem.sistrefrecurs,
                id: elem.id,
                georeferenciatPer: elem.georeferenciatper,
                nom: elem.nomtoponim,
                tipus: elem.tipus,
                dataCaptura: elem.datacaptura,
              },
              comment: elem.comment,
              id: elem.id_comment,
              nom_original: elem.nom_original,
            });
          }
          res.status(200)
            .json({
              totalRecords: totalRecords,
              success: true,
              recordsReturned: data.length,
              startIndex: startIndex,
              dir: dir,
              sort: sort,
              records: data_copy,
            });
        })
        .catch(function(err) {
          return next(err);
        });
    })
    .catch(function(err) {
      console.log(err);
    });
}

function getAuth(req, res, next) {
  var params = req.query;
  var username = params.user;
  var pwd = params.pwd;

  var validate = Joi.validate(req.query, val.getAuthValidator, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false,
  });

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  var squelPostgres = squel.useFlavour('postgres');
  var q_select = squelPostgres.select()
    .from('auth_user')
    .where('password=? AND username=?', pwd, username);

  db.one(q_select.toString())
    .then(function(data) {
      var token = jwt.sign({ id: data.id }, config.secret, {
        expiresIn: 86400, // expires in 24 hours
      });
      res.status(200)
        .json({
          success: true,
          message: 'OK',
          token: token,
        });
    })
    .catch(function(err) {
      if (err.code === qrec.noData){
        res.status(401)
          .json({
            success: true,
            message: 'Authentification failed',
          });
      } else {
        return next(err);
      }
    });
}


module.exports = {
  getToponimsPartNom: getToponimsPartNom,
  getAuth: getAuth,
  getTipusToponims: getTipusToponims,
  getToponim: getToponim,
  getArbre: getArbre,
  getToponimsGeo: getToponimsGeo,
  postComment: postComment,
  editComment: editComment,
  deleteComment: deleteComment,
  getComment: getComment,
};

