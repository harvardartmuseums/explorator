const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: 'layout.hbs', title: 'Image Explorer | Explorator | Harvard Art Museums' });
});

/* GET the image browser page. */
router.get('/browse', function(req, res, next) {
  res.render('browse', {layout: 'layout.hbs', title: 'Browser | Image Explorer | Explorator | Harvard Art Museums' });
});

/* GET the image alt text roulette page. */
router.get('/alt-text/roulette', function(req, res, next) {
  let criteria = {
    classification: "any",
    q: "images.alttext:* AND imagepermissionlevel:0",
    sort: "random",
    size: 1
  }
  HAM.Objects.search(criteria)
     .then(data => {
        let record = data.records[0];
        res.render('roulette', {layout: 'layout.hbs', title: 'Alt Text Roulette | Image Explorer | Explorator | Harvard Art Museums', object: record});
     });
});

module.exports = router;
