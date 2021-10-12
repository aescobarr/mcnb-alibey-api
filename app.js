'use strict';
// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');// call express
var app = express();// define our app using express

var bodyParser = require('body-parser');
var db = require('./queries.js');
var VerifyToken = require('./verify');
var HttpStatus = require('http-status-codes');
var multer = require('multer');
var config = require('./config.js').get(process.env.NODE_ENV);
var winston = require('winston');
var expressWinston = require('express-winston');

// configure mult storage parameters
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './comment_uploads/');
  },
  filename: function(req, file, cb) {
    var fileFormat = (file.originalname).split('.');
    cb(
      null,
      file.fieldname +
      '-' +
      Date.now() +
      '.' +
      fileFormat[fileFormat.length - 1]
    );
  },
});

var upload = multer({ storage: storage });


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = config.running_port || 8080;// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();// get an instance of the express Router

router.get('/toponimspartnom', VerifyToken, db.getToponimsPartNom);
router.get('/toponimspartnom.htm', VerifyToken, db.getToponimsPartNom);
router.get('/tipustoponim', VerifyToken, db.getTipusToponims);
router.get('/tipustoponim.htm', VerifyToken, db.getTipusToponims);
router.get('/toponimsgeo', VerifyToken, db.getToponimsGeo);
router.get('/toponimsgeo.htm', VerifyToken, db.getToponimsGeo);
router.get('/toponim', VerifyToken, db.getToponim);
router.get('/toponim.htm', VerifyToken, db.getToponim);
router.post('/comment_new', VerifyToken, upload.single('file'), db.postComment);
router.post('/comment_new.htm', VerifyToken, upload.single('file'), db.postComment);
router.post('/comment_edit', VerifyToken, upload.single('file'), db.editComment);
router.post('/comment_edit.htm', VerifyToken, upload.single('file'), db.editComment);
router.post('/comment_delete', VerifyToken, db.deleteComment);
router.post('/comment_delete.htm', VerifyToken, db.deleteComment);
router.get('/comment', VerifyToken, db.getComment);
router.get('/comment.htm', VerifyToken, db.getComment);
router.get('/arbre', VerifyToken, db.getArbre);
router.get('/arbre.htm', VerifyToken, db.getArbre);
router.get('/auth', db.getAuth);
router.get('/auth.htm', db.getAuth);

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
router_v1.post('/comment_new', VerifyToken, upload.single('file'), db.postComment);
router_v1.post('/comment_new.htm', VerifyToken, upload.single('file'), db.postComment);
router_v1.post('/comment_edit', VerifyToken, upload.single('file'), db.editComment);
router_v1.post('/comment_edit.htm', VerifyToken, upload.single('file'), db.editComment);
router_v1.post('/comment_delete', VerifyToken, db.deleteComment);
router_v1.post('/comment_delete.htm', VerifyToken, db.deleteComment);
router_v1.get('/comment', VerifyToken, db.getComment);
router_v1.get('/comment.htm', VerifyToken, db.getComment);
router_v1.get('/tree', VerifyToken, db.getArbre);
router_v1.get('/tree.htm', VerifyToken, db.getArbre);
router_v1.get('/auth', db.getAuth);
router_v1.get('/auth.htm', db.getAuth);

// LOGGING --------------------------------------------

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format:
    winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  msg: 'HTTP {{req.statusCode}} {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function(req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
}));


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


module.exports = router;
