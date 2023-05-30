var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Analytics Explorer | Explorator | Harvard Art Museums' });
});


/* GET most viewed online page. */
router.get('/most-viewed', function(req, res, next) {
  res.render('analytics-most-viewed-online', {layout: '../../core/views/layout.hbs', title: 'Most Viewed Online | Analytics Explorer | Explorator | Harvard Art Museums' });
});

module.exports = router;
