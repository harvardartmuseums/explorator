var router = require("express-promise-router")();
var ham = require('@harvardartmuseums/ham');

let HAM = new ham(process.env.apikey);

/* GET most viewed online page. */
router.get('/', function(req, res, next) {
  res.render('people-index', {layout: '../../core/views/layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums' });
});

router.get('/:id', async function(req, res, next) {
  let criteria =  req.params.id;
  
  let person = await HAM.People.get(criteria);

  person.exhibitions = [];
  person.publications = [];
  person.objects = [];
  person.exhibitioncount = 0;
  person.publicationcount = 0;

  let objects = await HAM.Objects.search({person: person.id, hasimage: 1, sort: 'random', q: 'imagepermissionlevel:0'});
  person.objects = objects.records;
  
  let objectsRelated = await HAM.Objects.search({person: person.id, size:0}, {'exhibitions': {'terms': {'field': 'exhibitions.exhibitionid', 'size': 200}}, 'publications': {'terms': {'field': 'publications.publicationid', 'size': 500}}});
  let exhibitionIds = objectsRelated.aggregations.exhibitions.buckets.map(e => e.key).join("|");
  let publicationIds = objectsRelated.aggregations.publications.buckets.map(e => e.key).join("|");
  
  if (exhibitionIds) {
    let exhibitions = await HAM.Exhibitions.search({id: exhibitionIds, sort: 'chronological', sortorder: 'desc'});
    
    person.exhibitioncount = exhibitions.info.totalrecords;
    person.exhibitions = exhibitions.records;
  }
  
  if (publicationIds) {
    let publications = await HAM.Publications.search({id: publicationIds, sort: 'publicationyear', sortorder: 'desc'});

    person.publicationcount = publications.info.totalrecords;
    person.publications = publications.records;
  }

  res.render('people-details', {layout: '../../core/views/layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums', person: person});
});

module.exports = router;
