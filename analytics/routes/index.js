let router = require("express-promise-router")();

router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Analytics Explorer | Explorator | Harvard Art Museums' });
});

router.get('/least-active', async function(req, res, next) {
  res.render('least-active', {layout: '../../core/views/layout.hbs', title: 'Least Active | Analytics Explorer | Explorator | Harvard Art Museums'})
});

/* GET most viewed online page. */
router.get('/most-viewed', function(req, res, next) {
  res.render('analytics-most-viewed-online', {layout: '../../core/views/layout.hbs', title: 'Most Viewed Online | Analytics Explorer | Explorator | Harvard Art Museums' });
});

module.exports = router;
