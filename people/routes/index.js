var express = require('express');
var router = express.Router();

/* GET most viewed online page. */
router.get('/', function(req, res, next) {
  res.render('people-index', {layout: 'layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums' });
});

module.exports = router;
