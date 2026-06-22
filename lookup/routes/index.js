var router = require("express-promise-router")();

router.get('/', function(req, res, next) {
  res.render('index', {
    layout: '../../core/views/layout.hbs',
    title: 'Quick Lookup | Explorator | Harvard Art Museums'
  });
});

module.exports = router;
