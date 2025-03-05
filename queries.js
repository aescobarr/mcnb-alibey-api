'use strict';

const jwt = require('jsonwebtoken');
require('dotenv').config();

const moment = require('moment');
const val = require('./validators.js');

const package_json = require('./package.json');

const pg = require('knex')({
  client: 'pg',
  connection: {    
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    user: process.env.SQL_USER,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASSWORD,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

// eslint-disable-next-line no-unused-vars
function getVersion(req, res, next) {
  res.status(200).json({
    version: package_json.version
  });  
}

function getToponimId(req, res, next) {
  var params = req.params;

  const q = pg("toponim").join("toponims_api","toponim.id","=","toponims_api.id");
  const q_versions = pg("toponimsversio_api");

  q.where('toponims_api.id', params.id);
  q_versions.where('idtoponim', params.id);

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
        if( data_copy.length == 0 ){
          res.status(404)
          .json({
            success: false,
            message: 'Not found'
          });
        }else{
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

// eslint-disable-next-line no-unused-vars
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
    if(authentication==null || authentication.length == 0){
      res.status(401)
      .json({
        success: true,
        message: 'Authentification failed',
      });
    }else{
      var token = jwt.sign({ id: authentication.id }, process.env.SECRET_KEY, {
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

module.exports = {
  getToponimsPartNom: getToponimsPartNom,
  getToponimId: getToponimId,
  getAuth: getAuth,
  getTipusToponims: getTipusToponims,
  getToponim: getToponim,
  getArbre: getArbre,
  getToponimsGeo: getToponimsGeo,
  getVersion: getVersion,  
}