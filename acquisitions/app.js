var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('hbs');

var routes = require('./routes');

var app = express();

hbs.registerHelper('makeGradient', (colors) => {
    let scale = 100;
    let steps = [];
    let stop = 0;
   
    colors.forEach((c, i) => {    
      if (i>0) stop += Math.round(colors[i-1].percentRounded);
      // a stupid hack to clamp the percents at the upper end between 1 and 100
      if (stop>=90) stop = stop - (stop - 100 + (colors.length-i)) + 1;
      steps.push(`rgba(${c.r},${c.g},${c.b},1) ${stop}%`);
    })
    
    return `linear-gradient(90deg, ${steps.toString()})`;
  });


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', routes);

module.exports = app;
