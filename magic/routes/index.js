const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Magic | Explorator | Harvard Art Museums' });
});

/* GET the exhibition timeline page. */
router.get('/poetry', function(req, res, next) {
    res.render('poetry', {layout: '../../core/views/layout.hbs', title: 'Magnetic Poetry | Magic | Explorator | Harvard Art Museums'});
});

router.get('/data/terms/:term', function(req, res, next) {
  let term = req.params.term;
  let criteria = {
    q: "type:text AND body:" + term,
    fields: "id,body,target,imageid,selectors",
    sort: "random",
    size: req.query.size || 25
  }
  HAM.Annotations.search(criteria)
     .then(data => {
        let terms = [];

        data.records.forEach(d => {
          if (d.body.toUpperCase() === term.toUpperCase()) {
            terms.push(d);
          }
        });

        res.json(terms);
     });
});

router.get('/data/images/:imageid/objects', function(req, res, next) {
	let imageid = req.params.imageid;
  let criteria = {
    q: `images.imageid:${imageid}`,
    size: req.query.size || 25
  };
  HAM.Objects.search(criteria)
    .then(data => {
      res.json(data);
    })
});


module.exports = router;
