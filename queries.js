'use strict';

// var promise = require('bluebird');
const jwt = require('jsonwebtoken');
// var config = require('./config.js');
const config = require('./config.js').get(process.env.NODE_ENV);
// const knex = require('knex');
// var squel = require('squel');
// var util = require('util');
const moment = require('moment');
const val = require('./validators.js');
//const knex = require('knex');
//const Joi = require('joi');
// var fs = require('fs');

const pg = require('knex')({
  client: 'pg',
  connection: {
    //connectionString: '',
    host: config.database_host,
    port: config.database_port,
    user: config.database_user,
    database: config.database_name,
    password: config.database_password,
    ssl: config['DB_SSL'] ? { rejectUnauthorized: false } : false,
  },
});

function getVersion(req, res, next) {
  res.status(200).json({
    version: '2.0.0'
  });  
}

function getToponim(req, res, next) {

  var params = req.query;
  var id = params.id;
  var single_id, multiple_id_array;

  const validate = val.getToponimsValidator.validate(req.query);
  
  if (validate.error){
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  if (id.indexOf(',') === -1){
    single_id = id;
  } else {
    multiple_id_array = id.split(',');    
  }
  
  const q = pg("toponim").join("toponims_api","toponim.id","=","toponims_api.id");
  const q_versions = pg("toponimsversio_api");

  if (single_id){
    q.where('toponims_api.id', single_id);
    q_versions.where('idtoponim', single_id);
  } else if (multiple_id_array){    
    q.whereIn('toponims_api.id',multiple_id_array);
    q_versions.whereIn('idtoponim', multiple_id_array);
  }

  var versions_map = {};

  q_versions.select()
  .then(function(rows){
      for (var i = 0; i < rows.length; i++){
        var elem = rows[i];
        var formatted_date_string = 'Data no establerta';
        if (elem.datacaptura != null){
          var formatted_date = moment(elem.datacaptura);
          formatted_date_string = formatted_date.format('DD/MM/YYYY');
        }
        var copied_elem = {
          id: elem.id,
          nom: elem.nom,
          nomToponim: elem.nomtoponim,
          tipus: elem.tipus,
          versio: elem.versio,
          qualificadorversio: elem.qualificadorversio,
          recursCaptura: elem.recurscaptura,
          sistrefrecurs: elem.sistrefrecurs,
          dataCaptura: formatted_date_string,
          coordXOriginal: elem.coordxoriginal,
          coordYOriginal: elem.coordyoriginal,
          coordz: elem.coordz,
          incertesaz: elem.incertesaz,
          georeferenciatPer: elem.georeferenciatper,
          observacions: elem.observacions,
          coordXCentroide: elem.coordxcentroide,
          coordYCentroide: elem.coordycentroide,
          incertesaCoord: elem.incertesacoord,
          idtoponim: elem.idtoponim
        };
        if (versions_map[copied_elem.idtoponim] == null){
          versions_map[copied_elem.idtoponim] = [];
        }
        versions_map[copied_elem.idtoponim].push(copied_elem);
      }
      q.select()
      .then(function(data){
        var original_data_json = JSON.stringify(data);
        var data_copy = JSON.parse(original_data_json);
        for (var i = 0; i < data_copy.length; i++){
          var elem = data_copy[i];
          elem.versions = versions_map[elem.id];
          elem.llinatge = [];
          var elems_llinatge = elem.denormalized_toponimtree.split('#');
          for (var j=0; j < elems_llinatge.length; j++){
            var elem_llinatge = elems_llinatge[j].split('$');
            elem.llinatge.push({ id: elem_llinatge[0], nom: elem_llinatge[1]});
          }
        }
        if (single_id){
          res.status(200)
            .json({
              totalRecords: data_copy.length,
              success: true,
              message: 'OK',
              recordsReturned: data_copy.length,
              id: data_copy[0].id,
              aquatic: data_copy[0].aquatic === false ? 'No' : 'Sí',
              nomToponim: data_copy[0].nomtoponim,
              tipus: data_copy[0].tipus,
              nom: data_copy[0].nom,
              versions: data_copy[0].versions,
              llinatge: data_copy[0].llinatge.reverse()
            });
        } else {
          var result_arr = [];
          for (i = 0; i < data_copy.length; i++){
            result_arr.push({
              id: data_copy[i].id,
              aquatic: data_copy[i].aquatic === false ? 'No' : 'Sí',
              nomToponim: data_copy[i].nomtoponim,
              tipus: data_copy[i].tipus,
              nom: data_copy[i].nom,
              versions: data_copy[i].versions,
              llinatge: data_copy[i].llinatge.reverse()
            });
          }
          res.status(200)
            .json({
              totalRecords: data_copy.length,
              success: true,
              message: 'OK',
              recordsReturned: data_copy.length,
              records: result_arr
            });
        }
      })
      .catch(function(error){
        return next(error);
      });
  })
  .catch(function(error){
    return next(error);
  });
}

function getTipusToponims(req, res, next) {

  const params = req.query;
  const dir = params.dir;
  const results = params.results;
  const startIndex = params.startIndex;
  var totalRecords = 0;

  var validate = val.getTipusToponimValidator.validate(params);

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  const q = pg('tipustoponim');
  const q_count = pg('tipustoponim').count('id');

  q_count.select()
    .then(function(data){      
      totalRecords = data.count;
    })
    .catch(function(err) {
      console.log(err);
    });  

  if(dir){
    q.orderBy('nom',dir);
  }else{
    q.orderBy('nom');
  }  

  if (results && !isNaN(parseInt(results, 10))){
    q.limit(parseInt(results, 10));
  }

  if (startIndex && !isNaN(parseInt(startIndex, 10))){
    q.offset(parseInt(startIndex, 10));
  }

  q.select('id','nom')
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

  var validate = val.getToponimsPartNomValidator.validate(params);

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }
  

  const q = pg('toponims_api');
  const columns = [
    'id',
    'nomtoponim',
    'nom',
    'aquatic',
    'tipus',
    'idtipus',
    'datacaptura',
    'coordenadaxcentroide',
    'coordenadaycentroide',
    'incertesa'
  ];  

  if (!sort){
    sort = 'nom';
  }

  if (sort){
    if (dir){      
      q.orderBy(sort_translation[sort],dir);    
    } else {
      q.orderBy(sort_translation[sort]);
    }
  }

  if (idtipus){
    q.where('idtipus', idtipus);
  }

  if (query){
    q.where('nom', 'ilike', '%' + query + '%');
  }

  const q_count = pg('toponims_api').count('id');  

  if (results && !isNaN(parseInt(results, 10))){
    q.limit(parseInt(results, 10));
  }

  if (startIndex && !isNaN(parseInt(startIndex, 10))){
    q.offset(parseInt(startIndex, 10));
  }
      
  q_count.select()
  .then(function(data) {
    totalRecords = data.count;
    q.select(columns)
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
    return next(err);
  });  
}

function getArbre(req, res, next) {
  const params = req.query;
  const _root = params.root;
  const _max_depth = params.max_depth;

  const validate = val.getArbreValidator.validate(params);

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  const q = pg('toponim')
  .join('toponims_api','toponim.id','=','toponims_api.id')
  .where('toponim.denormalized_toponimtree','ilike','%' + _root + '%')
  .orWhere('toponim.id','=',_root)
  .orderBy(pg.raw('length(toponim.denormalized_toponimtree)'), 'desc')
  .orderBy('toponim.nom')  

  //console.log(q.toString());
  q.select('toponims_api.*','toponim.denormalized_toponimtree')
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
        if (elem.denormalized_toponimtree.split('#').length === 1 && elem.denormalized_toponimtree.length === 0){
          tree_depth = 0;
        } else {
          tree_depth = elem.denormalized_toponimtree.split('#').length;
        }
        if (_max_depth == null || tree_depth <= _max_depth){
          elem.nomToponim = elem.nomtoponim;
          delete elem.nomtoponim;
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
  const params = req.query;
  const wkt = params.wkt;

  const validate = val.getToponimsGeoValidator.validate(params);

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  const q = pg('toponims_api')
  .join('geometries_api','toponims_api.id','=','geometries_api.id')
  .where( pg.raw('ST_WITHIN(geometria, ST_GeomFromText(\'' + wkt + '\',4326))' ) );  

  const columns = [
    'toponims_api.id',
    'toponims_api.nomtoponim',
    'toponims_api.nom',
    'toponims_api.aquatic',
    'toponims_api.tipus',
    'toponims_api.datacaptura',
    'toponims_api.coordenadaxcentroide',
    'toponims_api.coordenadaycentroide',
    'toponims_api.incertesa'
  ]

  console.log(q.toString());

  q.select(columns)
  .then(function(data) {
    for (var i = 0; i < data.length; i++){
      var elem = data[i];
      elem.nomToponim = elem.nomtoponim;
      delete elem.nomtoponim;
      elem.dataCaptura = elem.datacaptura;
      delete elem.datacaptura;
      elem.coordXCentroide = elem.coordenadaxcentroide;
      delete elem.coordenadaxcentroide;
      elem.coordYCentroide = elem.coordenadaycentroide;
      delete elem.coordenadaycentroide;
    }
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

// function getToponimsGeo(req, res, next) {
//   var params = req.query;
//   var wkt = params.wkt;

//   var validate = Joi.validate(req.query, val.getToponimsGeoValidator, {
//     // return an error if body has an unrecognised property
//     allowUnknown: false,
//     // return all errors a payload contains, not just the first one Joi finds
//     abortEarly: false,
//   });

//   if (validate.error){
//     console.log(validate.error.toString());
//     return res.status(403).send({
//       success: false,
//       message: 'Error in supplied parameters - ' + validate.error.toString(),
//     });
//   }

//   var squelPostgres = squel.useFlavour('postgres');

//   var q = squelPostgres.select()
//     .from('toponims_api', 't')
//     .from('geometries_api', 'g')
//     .where('t.id = g.id')
//     .where('ST_WITHIN(geometria, ST_GeomFromText(?,4326))', wkt)
//     .field('t.id')
//     .field('t.nomtoponim')
//     .field('t.nom')
//     .field('t.aquatic')
//     .field('t.tipus')
//     .field('t.datacaptura')
//     .field('t.coordenadaxcentroide')
//     .field('t.coordenadaycentroide')
//     .field('t.incertesa');

//   console.log(q.toString());

//   db.any(q.toString())
//     .then(function(data) {
//       for (var i = 0; i < data.length; i++){
//         var elem = data[i];
//         elem.nomToponim = elem.nomtoponim;
//         delete elem.nomtoponim;
//         elem.dataCaptura = elem.datacaptura;
//         delete elem.datacaptura;
//         elem.coordXCentroide = elem.coordenadaxcentroide;
//         delete elem.coordenadaxcentroide;
//         elem.coordYCentroide = elem.coordenadaycentroide;
//         delete elem.coordenadaycentroide;
//       }
//       res.status(200)
//         .json({
//           totalRecords: data.length,
//           success: true,
//           message: 'OK',
//           records: data,
//         });
//     })
//     .catch(function(err) {
//       return next(err);
//     });
// }

// function postComment(req, res, next) {

//   var params = req.query;
//   var idversio = params.idversio;
//   var comment = params.comment;
//   var date_s = params.date;
//   var date_date;
//   var author = params.author;
//   var file = req.file;

//   var validate = Joi.validate(req.query, val.getNewCommentValidator, {
//     // return an error if body has an unrecognised property
//     allowUnknown: false,
//     // return all errors a payload contains, not just the first one Joi finds
//     abortEarly: false,
//   });

//   if (validate.error){
//     console.log(validate.error.toString());
//     return res.status(403).send({
//       success: false,
//       message: 'Error in supplied parameters - ' + validate.error.toString(),
//     });
//   }

//   if (!date_s){
//     date_date = moment().toDate();
//   } else {
//     var parsed_moment = moment(date_s, 'DD/MM/YYYY HH:mm:ss', true);
//     if (!parsed_moment.isValid()){
//       return res.status(403).send({
//         success: false,
//         message: 'Invalid date format, must be DD/MM/YYYY HH:mm:ss',
//       });
//     }
//     date_date = parsed_moment.toDate();
//   }

//   var squelPostgres = squel.useFlavour('postgres');
//   var q_versio = squelPostgres.select()
//     .from('toponimsversio_api')
//     .where('id = ?', idversio)
//     .field('id')
//     .field('nom')
//     .field('nomtoponim')
//     .field('tipus')
//     .field('versio')
//     .field('qualificadorversio')
//     .field('recurscaptura')
//     .field('sistrefrecurs')
//     .field('datacaptura')
//     .field('coordxoriginal')
//     .field('coordyoriginal')
//     .field('coordz')
//     .field('incertesaz')
//     .field('georeferenciatper')
//     .field('observacions')
//     .field('coordxcentroide')
//     .field('coordycentroide')
//     .field('incertesacoord');

//   var q_insert = squelPostgres.insert()
//     .into('comments')
//     .set('comment', comment)
//     .set(
//       'data',
//       "to_timestamp('" +
//       date_date.toISOString() +
//       "','YYYY-MM-DD HH24:MI:SS')",
//       {dontQuote: true}
//     )
//     .set('author', author)
//     .set('idversio', idversio);

//   if (file && file.originalname){
//     q_insert.set('nom_original', file.originalname);
//   }

//   if (file && file.path){
//     q_insert.set('attachment', file.path);
//   }


//   db.one(q_versio.toString())
//     .then(function(data) {
//       db.one(q_insert.toString() + ' RETURNING *')
//         .then(function(insert_data) {
//           res.status(200)
//             .json({
//               date: insert_data.data,
//               totalRecords: 1,
//               attachment: insert_data.attachment,
//               author: insert_data.author,
//               versio: data,
//               success: true,
//               comment: insert_data.comment,
//               id: insert_data.id,
//               message: 'OK',
//               nom_original: insert_data.nom_original,
//             });
//         })
//         .catch(function(err) {
//           return next(err);
//         });
//     })
//     .catch(function(err) {
//       return next(err);
//     });
// }


// function editComment(req, res, next) {

//   var params = req.query;
//   var idcomment = params.idcomment;
//   var comment = params.comment;
//   var date_s = params.date;
//   var date_date;
//   var author = params.author;
//   var file = req.file;

//   var validate = Joi.validate(req.query, val.getExistingCommentValidator, {
//     // return an error if body has an unrecognised property
//     allowUnknown: false,
//     // return all errors a payload contains, not just the first one Joi finds
//     abortEarly: false,
//   });

//   if (validate.error){
//     console.log(validate.error.toString());
//     return res.status(403).send({
//       success: false,
//       message: 'Error in supplied parameters - ' + validate.error.toString(),
//     });
//   }

//   if (!date_s){
//     date_date = moment().toDate();
//   } else {
//     var parsed_moment = moment(date_s, 'DD/MM/YYYY HH:mm:ss', true);
//     if (!parsed_moment.isValid()){
//       return res.status(403).send({
//         success: false,
//         message: 'Invalid date format, must be DD/MM/YYYY HH:mm:ss',
//       });
//     }
//     date_date = parsed_moment.toDate();
//   }

//   var squelPostgres = squel.useFlavour('postgres');
//   var q_versio = squelPostgres.select()
//     .from('toponimsversio_api')
//     .where(
//       'id = ?',
//       squelPostgres.select()
//         .from('comments')
//         .where('id=?', idcomment)
//         .field('idversio')
//     )
//     .field('id')
//     .field('nom')
//     .field('nomtoponim')
//     .field('tipus')
//     .field('versio')
//     .field('qualificadorversio')
//     .field('recurscaptura')
//     .field('sistrefrecurs')
//     .field('datacaptura')
//     .field('coordxoriginal')
//     .field('coordyoriginal')
//     .field('coordz')
//     .field('incertesaz')
//     .field('georeferenciatper')
//     .field('observacions')
//     .field('coordxcentroide')
//     .field('coordycentroide')
//     .field('incertesacoord');

//   var q_update = squelPostgres.update()
//     .table('comments')
//     .set('comment', comment)
//     .set(
//       'data',
//       "to_timestamp('" +
//       date_date.toISOString() +
//       "','YYYY-MM-DD HH24:MI:SS')",
//       {dontQuote: true}
//     )
//     .set('author', author)
//     .where('id = ?', idcomment);

//   if (file && file.originalname){
//     q_update.set('nom_original', file.originalname);
//   }

//   if (file && file.path){
//     q_update.set('attachment', file.path);
//   }


//   db.one(q_versio.toString())
//     .then(function(data) {
//       db.one(q_update.toString() + ' RETURNING *')
//         .then(function(update_data) {
//           res.status(200)
//             .json({
//               date: update_data.data,
//               totalRecords: 1,
//               attachment: update_data.attachment,
//               author: update_data.author,
//               versio: data,
//               success: true,
//               comment: update_data.comment,
//               id: update_data.id,
//               message: 'OK',
//               nom_original: update_data.nom_original,
//             });
//         })
//         .catch(function(err) {
//           return next(err);
//         });
//     })
//     .catch(function(err) {
//       return next(err);
//     });
// }

// function deleteComment(req, res, next) {
//   var params = req.query;
//   var idcomment = params.idcomment;

//   var validate = Joi.validate(req.query, val.getDeleteCommentValidator, {
//     // return an error if body has an unrecognised property
//     allowUnknown: false,
//     // return all errors a payload contains, not just the first one Joi finds
//     abortEarly: false,
//   });

//   if (validate.error){
//     console.log(validate.error.toString());
//     return res.status(403).send({
//       success: false,
//       message: 'Error in supplied parameters - ' + validate.error.toString(),
//     });
//   }

//   var squelPostgres = squel.useFlavour('postgres');
//   var q_delete = squelPostgres.delete()
//     .from('comments')
//     .where('id = ?', idcomment);

//   db.one(q_delete.toString() + ' RETURNING *')
//     .then(function(delete_data) {
//       var file_name = delete_data.attachment;
//       fs.unlink(file_name, function(err){
//         if (err){
//           res.status(500).json({
//             success: false,
//             message: err,
//           });
//         }
//         res.status(200).json({
//           totalRecords: 1,
//           success: true,
//           message: 'OK',
//         });
//       });
//     })
//     .catch(function(err) {
//       return next(err);
//     });
// }

// function getComment(req, res, next) {
//   var params = req.query;
//   var sort = params.sort;
//   var sort_translation = {
//     comment: 'c.comment',
//     commentTimestamp: 'c.data',
//     nomOriginal: 'c.nom_original',
//     attachment: 'c.attachment',
//     author: 'c.author',
//   };
//   var dir = params.dir;
//   var idversio = params.idversio;
//   var id = params.id;
//   var results = params.results;
//   var startIndex = params.startIndex;
//   var totalRecords = 0;

//   var validate = Joi.validate(req.query, val.getCommentValidator, {
//     // return an error if body has an unrecognised property
//     allowUnknown: false,
//     // return all errors a payload contains, not just the first one Joi finds
//     abortEarly: false,
//   });

//   if (validate.error){
//     console.log(validate.error.toString());
//     return res.status(403).send({
//       success: false,
//       message: 'Error in supplied parameters - ' + validate.error.toString(),
//     });
//   }

//   var squelPostgres = squel.useFlavour('postgres');

//   var q_select = squelPostgres.select()
//     .from('comments', 'c')
//     .from('toponimsversio_api', 't')
//     .where('t.id = c.idversio');

//   var q_count = q_select.clone().field('count(*)');

//   q_select.field('c.id', 'id_comment')
//     .field('c.comment')
//     .field('c.data')
//     .field('c.attachment')
//     .field('c.nom_original')
//     .field('c.author')
//     .field('t.*');

//   if (id){
//     q_select.where('c.id = ?', id);
//   } else {
//     if (idversio){
//       q_select.where('t.id = ?', idversio);
//     }
//   }

//   if (sort){
//     if (dir){
//       if (dir === 'asc'){
//         q_select.order(sort_translation[sort]);
//       } else {
//         q_select.order(sort_translation[sort], false);
//       }
//     } else {
//       q_select.order(sort_translation[sort]);
//     }
//   }

//   if (results && !isNaN(parseInt(results, 10))){
//     q_select.limit(parseInt(results, 10));
//   }

//   if (startIndex && !isNaN(parseInt(startIndex, 10))){
//     q_select.offset(parseInt(startIndex, 10));
//   }

//   db.one(q_count.toString())
//     .then(function(data_count) {
//       totalRecords = parseInt(data_count.count, 10);
//       db.any(q_select.toString())
//         .then(function(data) {
//           var data_copy = [];
//           for (var i = 0; i < data.length; i++){
//             var elem = data[i];
//             data_copy.push({
//               date: elem.data,
//               attachment: elem.attachment,
//               author: elem.author,
//               versio: {
//                 coordXOriginal: elem.coordxoriginal,
//                 coordYOriginal: elem.coordyoriginal,
//                 recursCaptura: elem.recurscaptura,
//                 versio: elem.versio,
//                 observacions: elem.observacions,
//                 qualificadorVersio: elem.qualificadorversio,
//                 sistRefRecurs: elem.sistrefrecurs,
//                 id: elem.id,
//                 georeferenciatPer: elem.georeferenciatper,
//                 nom: elem.nomtoponim,
//                 tipus: elem.tipus,
//                 dataCaptura: elem.datacaptura,
//               },
//               comment: elem.comment,
//               id: elem.id_comment,
//               nom_original: elem.nom_original,
//             });
//           }
//           res.status(200)
//             .json({
//               totalRecords: totalRecords,
//               success: true,
//               recordsReturned: data.length,
//               startIndex: startIndex,
//               dir: dir,
//               sort: sort,
//               records: data_copy,
//             });
//         })
//         .catch(function(err) {
//           return next(err);
//         });
//     })
//     .catch(function(err) {
//       console.log(err);
//     });
// }

async function getAuth(req, res, next) {
  const params = req.query;
  const username = params.user;
  const pwd = params.pwd;
  const validate = val.getAuthValidator.validate(req.query);

  if (validate.error){
    console.log(validate.error.toString());
    return res.status(403).send({
      success: false,
      message: 'Error in supplied parameters - ' + validate.error.toString(),
    });
  }

  try {    
    const authentication = await pg("auth_user").where('username',username).andWhere('password', pwd);    
    if(authentication==null){
      res.status(401)
      .json({
        success: true,
        message: 'Authentification failed',
      });
    }else{
      var token = jwt.sign({ id: authentication.id }, config.secret, {
        expiresIn: 86400, // expires in 24 hours
      });
      res.status(200)
        .json({
          success: true,
          message: 'OK',
          token: token,
        });      
    }    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }  

}

// module.exports = {
//   getToponimsPartNom: getToponimsPartNom,
//   getAuth: getAuth,
//   getTipusToponims: getTipusToponims,
//   getToponim: getToponim,
//   getArbre: getArbre,
//   getToponimsGeo: getToponimsGeo,
//   postComment: postComment,
//   editComment: editComment,
//   deleteComment: deleteComment,
//   getComment: getComment,
// };

module.exports = {
  getToponimsPartNom: getToponimsPartNom,
  getAuth: getAuth,
  getTipusToponims: getTipusToponims,
  getToponim: getToponim,
  getArbre: getArbre,
  getToponimsGeo: getToponimsGeo,
  getVersion: getVersion,  
}