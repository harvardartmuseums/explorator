const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Image Explorer | Explorator | Harvard Art Museums' });
});

/* GET the image browser page. */
router.get('/browse', function(req, res, next) {
  res.render('browse', {layout: '../../core/views/layout.hbs', title: 'Browser | Image Explorer | Explorator | Harvard Art Museums' });
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
    res.render('roulette', {layout: '../../core/views/layout.hbs', title: 'Alt Text Roulette | Image Explorer | Explorator | Harvard Art Museums', object: record});
  });
});

router.get('/collage', function(req, res, next) {
  res.render('collage', {layout: '../../core/views/layout.hbs', title: 'Collage It | Image Explorer | Explorator | Harvard Art Museums' });
});

router.get('/collage/viewer', async function(req, res, next) {
  let criteria = {
    sort: 'random', 
    classification: req.query.types, 
    fields: 'title,images', 
    hasimage: 1, 
    size: req.query.quantity
  };  

  let results = await HAM.Objects.search(criteria);
  let records = results.records;
  let images = [];

  for (let index = 0; index < req.query.quantity; index++) {
    const object = records[index];
    
    let image = object.images[0];
    image.centerPoint = {
      x: Math.floor(image['width']/2),
      y: Math.floor(image['height']/2)
    };
    
    image.collage = [];
    image.collage.push(`${image['iiifbaseuri']}/0,0,${image.centerPoint.x},${image.centerPoint.y}/!300,300/0/native.jpg`);
    image.collage.push(`${image['iiifbaseuri']}/${image.centerPoint.x},0,${image.centerPoint.x},${image.centerPoint.y}/!300,300/0/native.jpg`);
    image.collage.push(`${image['iiifbaseuri']}/${image.centerPoint.x},${image.centerPoint.y},${image.centerPoint.x},${image.centerPoint.y}/!300,300/0/native.jpg`);
    image.collage.push(`${image['iiifbaseuri']}/0,${image.centerPoint.y},${image.centerPoint.x},${image.centerPoint.y}/!300,300/0/native.jpg`);

    image.object = object;
    images.push(image);
  };
  
  res.render('collage-viewer', {layout: '../../core/views/layout.hbs', title: 'Collage It | Image Explorer | Explorator | Harvard Art Museums', images: images});
});

module.exports = router;
