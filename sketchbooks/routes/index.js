var express = require('express');
var router = express.Router();

/* GET most viewed online page. */
router.get('/piene', function(req, res, next) {
  res.render('piene-index', {layout: 'layout.hbs', title: 'Otto Piene Sketchbook Explorer | Explorator | Harvard Art Museums' });
});

module.exports = router;
