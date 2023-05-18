var router = require("express-promise-router")();
var ham = require('@harvardartmuseums/ham');

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Image Explorer | Explorator | Harvard Art Museums' });
});

/* GET the image browser page. */
router.get('/browse', function(req, res, next) {
  res.render('browse', {layout: '../../core/views/layout.hbs', title: 'Browser | Image Explorer | Explorator | Harvard Art Museums' });
});

/* GET the image alt text roulette page. */
router.get('/alt-text/roulette', async function(req, res, next) {
  let criteria = {
    classification: "any",
    q: "images.alttext:* AND imagepermissionlevel:0",
    sort: "random",
    size: 1
  }
  
  let object = await HAM.Objects.search(criteria);
  let record = object.records[0];

  res.render('roulette', {layout: '../../core/views/layout.hbs', title: 'Alt Text Roulette | Image Explorer | Explorator | Harvard Art Museums', object: record});
});

module.exports = router;
