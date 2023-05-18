var router = require("express-promise-router")();
var ham = require('@harvardartmuseums/ham');

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Magic | Explorator | Harvard Art Museums' });
});

/* GET the exhibition timeline page. */
router.get('/poetry', function(req, res, next) {
    res.render('poetry', {layout: '../../core/views/layout.hbs', title: 'Magnetic Poetry | Magic | Explorator | Harvard Art Museums'});
});

router.get('/data/terms/:term', async function(req, res, next) {
  let term = req.params.term;
  let criteria = {
    q: "type:text AND body:" + term,
    fields: "id,body,target,imageid,selectors",
    sort: "random",
    size: req.query.size || 25
  }
  
  let annotations = await HAM.Annotations.search(criteria);
  let terms = [];

  annotations.records.forEach(d => {
    if (d.body.toUpperCase() === term.toUpperCase()) {
      terms.push(d);
    }
  });

  res.json(terms);
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
