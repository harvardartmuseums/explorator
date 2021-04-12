var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

/* GET most viewed online page. */
router.get('/piene/colors', function(req, res, next) {
  res.render('piene-colors', {layout: 'layout.hbs', title: 'Otto Piene Color | Explorer | Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/images', function(req, res, next) {
  res.render('piene-images', {layout: 'layout.hbs', title: 'Otto Piene Images | Explorer | Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

module.exports = router;
