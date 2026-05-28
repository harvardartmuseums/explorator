var express = require('express');
const ham  = require('@harvardartmuseums/ham');
const _ = require('lodash');
var router = require("express-promise-router")();

let HAM = new ham(process.env.apikey);
let HAM_OWNER = new ham(process.env.apikey_owner);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Book Explorer | Explorator | Harvard Art Museums' });
});

//-------------------------------------------------------
// Piene Sketchbook routes
//-------------------------------------------------------
/* GET most viewed online page. */
router.get('/piene/colors', function(req, res, next) {
  res.render('piene-colors', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Color | Book Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/histogram', function(req, res, next) {
  res.render('piene-histogram', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Histogram | Book Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/images', function(req, res, next) {
  res.render('piene-images', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Images | Book Explorer | Explorator | Harvard Art Museums' });
});

router.get('/piene/stacks', function(req, res, next) {
  res.render('piene-image-stack', {layout: '../../core/views/layout.hbs', title: 'Otto Piene Images | Book Explorer | Explorator | Harvard Art Museums' });
});

//-------------------------------------------------------
// Scrapbooks routes
//-------------------------------------------------------
router.get('/archives/scrapbooks', async function(req, res, next) {
  let data = {
    fogg: [],
    busch: [],
    stats: {
      books: 0,
      images: 0
    }
  };
  
  let criteria = {
    size: 100,
    fields: 'title,objectnumber,images,dated,datebegin,dateend,imagecount',
    worktype: 'scrapbook',
    sort: 'datebegin',
    q: 'department:"Archives" AND (title:"Fogg Museum Scrapbook" OR "Fogg Art Museum Scrapbook")'
  };
  let aggs = {};
  
  data.fogg = await HAM_OWNER.Objects.search(criteria, aggs);  
  
  data.fogg.records.forEach(r => {
    data.stats.images += r.images.length;
  });
  data.stats.books = data.fogg.records.length;

  criteria = {
    size: 100,
    fields: 'title,objectnumber,images,dated,datebegin,dateend,imagecount',
    worktype: 'scrapbook',
    sort: 'datebegin',
    q: 'department:"Archives" AND ("Busch-Reisinger Museum Scrapbook")'
  };
  aggs = {};
  
  data.busch = await HAM_OWNER.Objects.search(criteria, aggs);  

  data.busch.records.forEach(r => {
    data.stats.images += r.images.length;
  });
  data.stats.books += data.busch.records.length;

  res.render('archives-scrapbooks', {
    layout: '../../core/views/layout.hbs', 
    title: 'Archives Scrapbooks | Book Explorer | Explorator | Harvard Art Museums', 
    data: data });
});

router.get('/archives/scrapbooks/search', async function (req, res, next) {
  let term = req.query.term;
  let criteria = {
    q: `body:${term}`,
    size: 0
  };
  let aggs = {
    "by_image": {
      "terms": {
        "field":"imageid",
        "size":10000
      }
    }
  };

  let images = await HAM_OWNER.Annotations.search(criteria, aggs);
  let list = images.aggregations.by_image.buckets;
  
  res.json(_.map(list, "key"));
});

router.get('/archives/scrapbooks/:id', async function(req, res, next) {
  let data = await HAM_OWNER.Objects.get(req.params.id);

  res.render('archives-scrapbooks-details', {layout: '../../core/views/layout.hbs', title: 'Archives Scrapbooks | Book Explorer | Explorator | Harvard Art Museums', data: data });
});

router.get('/archives/scrapbooks/:id/page/:imageid', async function(req, res, next) {
  let data = {
    object: {},
    image: {},
    annotations: {},
    descriptions: {}
  };

  data.object = await HAM_OWNER.Objects.get(req.params.id);
  data.image = await HAM_OWNER.Images.get(req.params.imageid);
  data.annotations = await HAM_OWNER.Annotations.search({image: req.params.imageid, size:200});

  data.descriptions = await HAM_OWNER.Annotations.search({
      image: req.params.imageid, 
      q: 'source:"Anthropic" OR "OpenAI" OR "Amazon" OR "Meta" OR "Google Gemini" OR "Mistral" OR "Qwen"'});

  res.render('archives-scrapbooks-details-page', {layout: '../../core/views/layout.hbs', title: 'Archives Scrapbooks | Book Explorer | Explorator | Harvard Art Museums', data: data });
});


router.get('/archives/scrapbooks/:id/page/:imageid/search', async function(req, res, next) {
  let data = {
    imageid: req.params.imageid,
    annotations: [], 
    anno_format: []
  };

  let term = req.query.term;
  if (term.length > 3) {
    let params = {
      image: req.params.imageid,
      size: 500,
      fields: 'source,body,selectors,raw.iiifTextImageURL',
      type: 'text',
      q: `body:${term}`
    };

    data.annotations = await HAM_OWNER.Annotations.search(params);

    // format for annotorius: https://annotorious.dev/api-reference/image-annotation/
    let anno_format = [];
    data.annotations.records.forEach(r => {
      if (r.body.toLowerCase() === term.toLowerCase()) {
        let selector =  r.selectors[0].value;
        let selector_parts = selector.split("=");
        let geometry = selector_parts[1].split(",");

        let a = {
          id: r.id,
          target: {
            annotation: r.id,
            selector: {
                type: 'RECTANGLE',
                geometry: {
                  x: geometry[0],
                  y: geometry[1],
                  w: geometry[2],
                  h: geometry[3],
                  bounds: {
                    minX: geometry[0], 
                    minY: geometry[1], 
                    maxX: geometry[2], 
                    maxY: geometry[3]
                  }
                }
            }
          }
        }
        anno_format.push(a);
      }
    });
    data.anno_format = anno_format;
  }

  res.json(data);
});

module.exports = router;
