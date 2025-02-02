var router = require("express-promise-router")();
var ham = require('@harvardartmuseums/ham');
var _ = require('lodash');

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Image Explorer | Explorator | Harvard Art Museums' });
});

/* GET the image browser page. */
router.get('/browse', function(req, res, next) {
  res.render('browse', {layout: '../../core/views/layout.hbs', title: 'Browser | Image Explorer | Explorator | Harvard Art Museums' });
});

router.get('/browse/data', async function(req, res, next) {
  let criteria = {
    q: "images.alttext:* AND imagepermissionlevel:0",
    classification: "any",
    sort: "id",
    page: req.query.page,
    size: req.query.size
  };

  let objects = await HAM.Objects.search(criteria);

  let imageIdList = objects.records.map(r => r.images[0].imageid).join("|");
  criteria = {
    image: imageIdList,
    size: 100,
    fields: 'body,imageid,source,model',
    q: 'source: ("Azure OpenAI Service" OR "Anthropic" OR "Amazon" OR "Meta")'
  };
  let annotations = await HAM.Annotations.search(criteria);

  annotations.records.forEach(a => {
    let object = _.find(objects.records, {images: [{imageid: a.imageid}]});
    if (object) {
      let image = _.find(object.images, {imageid: a.imageid});
      if (image) {
        if (a.source === "Azure OpenAI Service") {
          image.openaidescription = a;
        } else if (a.source === "Anthropic") {
          image.anthropicaidescription = a;
        } else if (a.source === "Amazon") {
          image.amazonaidescription = a;
        } else if (a.source === "Meta") {
          image.metaaidescription = a;
        } else {

        }
      }
    }
  })

  objects.info.next = null;
  objects.info.prev = null;
  res.json(objects);
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

  criteria = {
    image: record.images[0].imageid,
    size: 1,
    fields: 'body,imageid,source',
    q: 'source: "Anthropic"'
  };
  let annotations = await HAM.Annotations.search(criteria);

  if (annotations.records.length == 1) {
    record.images[0].anthropicaidescription = annotations.records[0].body;
  } else {
    record.images[0].anthropicaidescription = "Mum's the word.";
  }

  res.render('roulette', {layout: '../../core/views/layout.hbs', title: 'Alt Text Roulette | Image Explorer | Explorator | Harvard Art Museums', object: record});
});

module.exports = router;
