'use strict';
// BASE SETUP
// =============================================================================

// call the packages we need
const express = require('express');// call express
const app = express();// define our app using express

require('dotenv').config();

const db = require('./queries.js');
const VerifyToken = require('./verify');
const { rateLimit } = require("express-rate-limit");
const test_limit_params = {
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 200, // each IP can make up to 200 requests per `windowsMs` (1 minute)
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
};
const limit_params = {  
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 20, // each IP can make up to 20 requests per `windowsMs` (1 minute)
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response  
}
const limiter = rateLimit( process.env.NODE_ENV == 'test' ? test_limit_params : limit_params );

const HttpStatus = require('http-status-codes');

const winston = require('winston');
const expressWinston = require('express-winston');

const port = process.env.RUNNING_PORT || 8080;// set our port

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();// get an instance of the express Router

router.get('/toponimspartnom', [VerifyToken, limiter], db.getToponimsPartNom);
router.get('/toponimspartnom.htm', [VerifyToken, limiter], db.getToponimsPartNom);
router.get('/tipustoponim', [VerifyToken, limiter], db.getTipusToponims);
router.get('/tipustoponim.htm', [VerifyToken, limiter], db.getTipusToponims);
router.get('/toponimsgeo', [VerifyToken, limiter], db.getToponimsGeo);
router.get('/toponimsgeo.htm', [VerifyToken, limiter], db.getToponimsGeo);
router.get('/toponim', [VerifyToken, limiter], db.getToponim);
router.get('/toponim/:id', [limiter], db.getToponimId);
router.get('/toponim.htm', [VerifyToken, limiter], db.getToponim);
router.get('/arbre', [VerifyToken, limiter], db.getArbre);
router.get('/arbre.htm', [VerifyToken, limiter], db.getArbre);
router.get('/auth', limiter, db.getAuth);
router.get('/auth.htm', limiter, db.getAuth);
router.get('/version',  limiter, db.getVersion);

// ROUTES FOR V1 API
// =============================================================================
var router_v1 = express.Router();// get an instance of the express Router

router_v1.get('/sitepartname', [VerifyToken, limiter], db.getToponimsPartNom);
router_v1.get('/sitepartname.htm', [VerifyToken, limiter], db.getToponimsPartNom);
router_v1.get('/sitetype', [VerifyToken, limiter], db.getTipusToponims);
router_v1.get('/sitetype.htm', [VerifyToken, limiter], db.getTipusToponims);
router_v1.get('/sitegeo', [VerifyToken, limiter], db.getToponimsGeo);
router_v1.get('/sitegeo.htm', [VerifyToken, limiter], db.getToponimsGeo);
router_v1.get('/site', [VerifyToken, limiter], db.getToponim);
router_v1.get('/site/:id', [limiter], db.getToponimId);
router_v1.get('/site.htm', [VerifyToken, limiter], db.getToponim);
router_v1.get('/tree', [VerifyToken, limiter], db.getArbre);
router_v1.get('/tree.htm', [VerifyToken, limiter], db.getArbre);
router_v1.get('/auth', limiter, db.getAuth);
router_v1.get('/auth.htm', limiter, db.getAuth);
router_v1.get('/version', limiter, db.getVersion);

// LOGGING --------------------------------------------

if(process.env.LOG_LEVEL != 'none'){
  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console()
    ],
    format:
      winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    // eslint-disable-next-line no-unused-vars
    level: function(req, res) { return process.env.LOG_LEVEL; },
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: 'HTTP {{req.statusCode}} {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    // eslint-disable-next-line no-unused-vars
    ignoreRoute: function(req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
  }));
}


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use('/api/v1', router_v1);

// ERROR LOGGING -------------------------------------

app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

var errorCodeIsHttpValid = function(code){
  for (var key in HttpStatus){
    if (code === HttpStatus[key]){
      return true;
    }
  }
  return false;
};

// ERROR HANDLERS ------------------------------------
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  var status = 500;
  if (errorCodeIsHttpValid(err.code)){
    status = err.code;
  }
  res.status(status)
    .json({
      success: false,
      message: err,
    });
});

// RATE LIMITING
app.use(limiter);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Listening on port ' + port);
console.log('Node env ' + process.env.NODE_ENV);


module.exports = router;
