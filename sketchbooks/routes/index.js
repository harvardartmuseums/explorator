var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Sketchbook Demos | Explorator | Harvard Art Museums' });
});

/* GET most viewed online page. */
router.get('/piene/colors', function(req, res, next) {
  res.render('piene-colors', {layout: 'layout.hbs', title: 'Otto Piene Color | Explorer | Sketchbook Demos | Explorator | Harvard Art Museums' });
});

module.exports = router;
