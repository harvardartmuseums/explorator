var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

/* GET most viewed online page. */
router.get('/piene/colors', function(req, res, next) {
  res.render('piene-colors', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Color | Explorer | Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/histogram', function(req, res, next) {
  res.render('piene-histogram', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Histogram | Explorer | Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/images', function(req, res, next) {
  res.render('piene-images', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Images | Explorer | Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/stacks', function(req, res, next) {
  res.render('piene-image-stack', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Images | Explorer | Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

module.exports = router;
