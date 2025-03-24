'use strict';

var Joi = require('joi');
var wicket = require('wicket');

var toponimIdSchema = Joi.object().keys({
  id: Joi.string().required(),
});

var tipusToponimSchema = Joi.object().keys({
  dir: Joi.string().valid('asc', 'desc'),
  results: Joi.number().integer(),
  startIndex: Joi.number().integer(),
});


var toponimsPartNom = Joi.object().keys({
  sort: Joi.string().valid('data', 'nom', 'aquatic', 'tipus'),
  dir: Joi.string().valid('asc', 'desc'),
  results: Joi.number().integer(),
  startIndex: Joi.number().integer(),
  query: Joi.string(),
  idtipus: Joi.string(),
});

var arbre = Joi.object().keys({
  root: Joi.string().required(),
  max_depth: Joi.number().positive().allow(0),
});

var geo = Joi.object().keys({
  wkt: Joi
    .string()
    .required()
    .custom(function(value,helper){
      const wkt = new wicket.Wkt();
      wkt.read(value);
      return true;
    })
});

var comment_new = Joi.object().keys({
  idversio: Joi.string().required(),
  comment: Joi.string().required(),
  date: Joi.string(),
  author: Joi.string().max(500).required(),
});

var comment_existing = Joi.object().keys({
  idcomment: Joi.number().integer().required(),
  comment: Joi.string().required(),
  date: Joi.string(),
  author: Joi.string().max(500).required(),
});

var comment_delete = Joi.object().keys({
  idcomment: Joi.number().integer().required(),
});

var comment_get = Joi.object().keys({
  sort: Joi.string().valid('comment', 'commentTimestamp',
    'nomOriginal', 'attachment', 'author'),
  dir: Joi.string().valid('asc', 'desc'),
  results: Joi.number().integer(),
  startIndex: Joi.number().integer(),
  idversio: Joi.string(),
  id: Joi.number().integer(),
  query: Joi.string(),
  idtipus: Joi.string(),
});

var auth = Joi.object().keys({
  user: Joi.string().required(),
  pwd: Joi.string().required(),
});

module.exports = {
  getToponimsValidator: toponimIdSchema,
  getTipusToponimValidator: tipusToponimSchema,
  getToponimsPartNomValidator: toponimsPartNom,
  getArbreValidator: arbre,
  getToponimsGeoValidator: geo,
  getNewCommentValidator: comment_new,
  getExistingCommentValidator: comment_existing,
  getDeleteCommentValidator: comment_delete,
  getCommentValidator: comment_get,
  getAuthValidator: auth,
};
