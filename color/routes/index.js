var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET most viewed online page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Color Explorer | Explorator | Harvard Art Museums' });
});

router.get('/spectrum', function(req, res, next) {
    res.render('spectrum', {layout: '../../core/views/layout.hbs', title: 'Spectrum | Explorator | Harvard Art Museums' });
  });
  

module.exports = router;