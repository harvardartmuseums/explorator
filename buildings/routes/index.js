var router = require("express-promise-router")();
const ham  = require('@harvardartmuseums/ham');

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Building Explorer | Explorator | Harvard Art Museums' });
});

router.get('/graphs', function(req, res, next) {
  res.render('graphs', {layout: '../../core/views/layout.hbs', title: 'Graph View | Building Explorer | Explorator | Harvard Art Museums' });
});

module.exports = router;