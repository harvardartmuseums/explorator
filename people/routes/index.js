var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET most viewed online page. */
router.get('/', function(req, res, next) {
  res.render('people-index', {layout: 'layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums' });
});

router.get('/:id', async function(req, res, next) {
  let criteria =  req.params.id;
  
  let person = await HAM.People.get(criteria);
  let objects = await HAM.Objects.search({person: person.id, hasimage: 1, sort: 'random', q: 'imagepermissionlevel:0'});

  person.objects = objects.records;

  res.render('people-details', {layout: 'layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums', person: person});
});

module.exports = router;
