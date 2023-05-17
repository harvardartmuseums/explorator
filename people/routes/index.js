var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET most viewed online page. */
router.get('/', function(req, res, next) {
  res.render('people-index', {layout: '../../core/views/layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums' });
});

router.get('/:id', async function(req, res, next) {
  let criteria =  req.params.id;
  
  let person = await HAM.People.get(criteria);

  let objects = await HAM.Objects.search({person: person.id, hasimage: 1, sort: 'random', q: 'imagepermissionlevel:0'});
  person.objects = objects.records;
  
  person.exhibitions = [];
  person.exhibitioncount = 0;
  
  let objectsExhibited = await HAM.Objects.search({person: person.id, size:0}, {'exhibitions': {'terms': {'field': 'exhibitions.exhibitionid', 'size': 200}}});
  let exhibitionIds = objectsExhibited.aggregations.exhibitions.buckets.map(e => e.key).join("|");
  
  if (exhibitionIds) {
    let exhibitions = await HAM.Exhibitions.search({id: exhibitionIds, sort: 'chronological', sortorder: 'desc'});

    person.exhibitioncount = exhibitions.info.totalrecords;
    person.exhibitions = exhibitions.records;
  }

  res.render('people-details', {layout: '../../core/views/layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums', person: person});
});

module.exports = router;
