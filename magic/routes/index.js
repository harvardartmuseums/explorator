var router = require("express-promise-router")();
var ham = require('@harvardartmuseums/ham');
var objectHelper = require('../helpers/object-helper');
var aiWriter = require('../helpers/ai-writer');
const _ = require("lodash");

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Magic | Explorator | Harvard Art Museums' });
});

/* GET the exhibition timeline page. */
router.get('/poetry', function(req, res, next) {
    res.render('poetry', {layout: '../../core/views/layout.hbs', title: 'Magnetic Poetry | Magic | Explorator | Harvard Art Museums'});
});

/* GET the exhibition timeline page. */
router.get('/typewriter', function(req, res, next) {
    res.render('typewriter', {layout: '../../core/views/layout.hbs', title: 'Art Typewriter | Magic | Explorator | Harvard Art Museums'});
});

router.get('/crosstalk', async function(req, res, next) {
  let criteria = {
    gallery: 1220,
    sort: "random",
    size: 2,
    fields: "title,primaryimageurl,objectid,colors,url"
  };

  let objects = await HAM.Objects.search(criteria);
  
  res.render('crosstalk', {
                layout: '../../core/views/layout.hbs', 
                title: 'Crosstalk | Explorator | Harvard Art Museums',
                objects: objects.records,
                storysettings: {
                  type: _.sample(aiWriter.storyTypes),
                  model: _.sample(aiWriter.models)
                },
                storyoptions: {
                  types: aiWriter.storyTypes,
                  models: aiWriter.models
                }
              });
});

router.get('/crosstalk/generate/:objectid0-:objectid1', async function (req, res, next) {
  let object0 = await objectHelper.getObject(req.params.objectid0)
  let object1 = await objectHelper.getObject(req.params.objectid1)

  let dialog = await aiWriter.generateStory(object0, object1, {
    storyType: req.query.storyType,
    modelName: req.query.modelName
  });

  res.json({dialog: dialog});
});

router.get('/data/terms/:term', async function(req, res, next) {
  let term = req.params.term;
  let criteria = {
    q: `type:text AND (body:${term}) AND ${term} AND accesslevel:1`,
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

router.get('/data/images/:imageid/objects', async function(req, res, next) {
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
