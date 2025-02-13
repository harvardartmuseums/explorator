var express = require('express');
const ham  = require('@harvardartmuseums/ham');
var router = require("express-promise-router")();

let HAM = new ham(process.env.apikey);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Book Explorer | Explorator | Harvard Art Museums' });
});

/* GET most viewed online page. */
router.get('/piene/colors', function(req, res, next) {
  res.render('piene-colors', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Color | Explorer | Book Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/histogram', function(req, res, next) {
  res.render('piene-histogram', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Histogram | Explorer | Book Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/images', function(req, res, next) {
  res.render('piene-images', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Images | Explorer | Book Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/stacks', function(req, res, next) {
  res.render('piene-image-stack', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Images | Explorer | Book Explorer | Explorator | Harvard Art Museums' });
});

router.get('/archives/scrapbooks', async function(req, res, next) {
  let data = {
    fogg: [],
    busch: []
  };
  
  let criteria = {
    size: 100,
    fields: 'title,objectnumber,images,dated,datebegin,dateend',
    worktype: 'scrapbook',
    sort: 'datebegin',
    q: 'department:"Archives" AND (title:"Fogg Museum Scrapbook" OR "Fogg Art Museum Scrapbook")'
  };
  let aggs = {};
  
  data.fogg = await HAM.Objects.search(criteria, aggs);  

  criteria = {
    size: 100,
    fields: 'title,objectnumber,images,dated,datebegin,dateend',
    worktype: 'scrapbook',
    sort: 'datebegin',
    q: 'department:"Archives" AND ("Busch-Reisinger Museum Scrapbook")'
  };
  aggs = {};
  
  data.busch = await HAM.Objects.search(criteria, aggs);  

  res.render('archives-scrapbooks', {layout: '../../core/views/layout.hbs', title: 'Archives Scrapbooks | Explorer | Book Explorer | Explorator | Harvard Art Museums', data: data });
});

router.get('/archives/scrapbooks/:id', async function(req, res, next) {
  let data = await HAM.Objects.get(req.params.id);

  res.render('archives-scrapbooks-details', {layout: '../../core/views/layout.hbs', title: 'Archives Scrapbooks | Explorer | Book Explorer | Explorator | Harvard Art Museums', data: data });
});

router.get('/archives/scrapbooks/:id/page/:imageid', async function(req, res, next) {
  let data = {
    object: {},
    image: {},
    annotations: {}
  };

  data.object = await HAM.Objects.get(req.params.id);
  data.image = await HAM.Images.get(req.params.imageid);
  data.annotations = await HAM.Annotations.search({image: req.params.imageid, size:200});

  res.render('archives-scrapbooks-details-page', {layout: '../../core/views/layout.hbs', title: 'Archives Scrapbooks | Explorer | Book Explorer | Explorator | Harvard Art Museums', data: data });
});
module.exports = router;
