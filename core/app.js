var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var data = require('../data/app');
var analytics = require('../analytics/app');
var people = require('../people/app');
var sketchbooks = require('../sketchbooks/app');
var images = require('../images/app');
var color = require('../color/app');
var exhibitions = require('../exhibitions/app');
var magic = require('../magic/app');
var buildings = require('../buildings/app');
var acquisitions = require('../acquisitions/app');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/data', data);
app.use('/analytics', analytics);
app.use('/people', people);
app.use('/sketchbooks', sketchbooks);
app.use('/images', images);
app.use('/color', color);
app.use('/exhibitions', exhibitions);
app.use('/magic', magic);
app.use('/buildings', buildings);
app.use('/acquisitions', acquisitions);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
