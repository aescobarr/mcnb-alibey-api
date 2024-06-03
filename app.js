'use strict';
// BASE SETUP
// =============================================================================

// call the packages we need
const express = require('express');// call express
const app = express();// define our app using express

require('dotenv').config();

const db = require('./queries.js');
const VerifyToken = require('./verify');
const HttpStatus = require('http-status-codes');

const winston = require('winston');
const expressWinston = require('express-winston');

const port = process.env.RUNNING_PORT || 8080;// set our port

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();// get an instance of the express Router

router.get('/toponimspartnom', VerifyToken, db.getToponimsPartNom);
router.get('/toponimspartnom.htm', VerifyToken, db.getToponimsPartNom);
router.get('/tipustoponim', VerifyToken, db.getTipusToponims);
router.get('/tipustoponim.htm', VerifyToken, db.getTipusToponims);
router.get('/toponimsgeo', VerifyToken, db.getToponimsGeo);
router.get('/toponimsgeo.htm', VerifyToken, db.getToponimsGeo);
router.get('/toponim', VerifyToken, db.getToponim);
router.get('/toponim.htm', VerifyToken, db.getToponim);
router.get('/arbre', VerifyToken, db.getArbre);
router.get('/arbre.htm', VerifyToken, db.getArbre);
router.get('/auth', db.getAuth);
router.get('/auth.htm', db.getAuth);
router.get('/version',  db.getVersion);

// ROUTES FOR V1 API
// =============================================================================
var router_v1 = express.Router();// get an instance of the express Router

router_v1.get('/sitepartname', VerifyToken, db.getToponimsPartNom);
router_v1.get('/sitepartname.htm', VerifyToken, db.getToponimsPartNom);
router_v1.get('/sitetype', VerifyToken, db.getTipusToponims);
router_v1.get('/sitetype.htm', VerifyToken, db.getTipusToponims);
router_v1.get('/sitegeo', VerifyToken, db.getToponimsGeo);
router_v1.get('/sitegeo.htm', VerifyToken, db.getToponimsGeo);
router_v1.get('/site', VerifyToken, db.getToponim);
router_v1.get('/site.htm', VerifyToken, db.getToponim);
router_v1.get('/tree', VerifyToken, db.getArbre);
router_v1.get('/tree.htm', VerifyToken, db.getArbre);
router_v1.get('/auth', db.getAuth);
router_v1.get('/auth.htm', db.getAuth);
router_v1.get('/version',  db.getVersion);

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

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Listening on port ' + port);
console.log('Node env ' + process.env.NODE_ENV);


module.exports = router;
