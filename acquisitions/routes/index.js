var router = require("express-promise-router")();
const ham  = require('@harvardartmuseums/ham');
const _ = require('lodash');
const list = require('../public/data/list');

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
    res.render('index', {layout: '../../core/views/layout.hbs', title: 'Acquisitions Explorer | Explorator | Harvard Art Museums' });
});

router.get('/stats', async function(req, res, next) {
    let criteria = {
        size: 0,
        q: 'accessionyear:>=2014'
    }

    let aggs = {
        "by_year": {
          "terms": {
            "field": "accessionyear",
            "size": 10,
            "order": { "_key": "desc" }     
          },
          "aggs": {
            "colors": {
              "nested": {
                "path": "colors"
              },
              "aggs": {
                "by_color": {
                "terms": {
                  "field": "colors.color",
                  "size": 100,
                }
              }
              }
          }
          }
        }

    };

    let data = await HAM.Objects.search(criteria, aggs);

    // console.log(data.aggregations.by_year.buckets[0].colors.by_color.buckets)
    res.render('stats', {layout: '../../core/views/layout.hbs', title: 'Acquisitions Explorer | Explorator | Harvard Art Museums', stats: data });
});



router.get('/stats/:yearfrom-:yearto', async function(req, res, next) {
  let criteria = {
    q: `accessionyear:>=${req.params.yearfrom} AND accessionyear:<=${req.params.yearto}`,
    size: 100,
    fields: 'title,images,colors,classification,accessionyear,dated,datebegin,dateend,objectnumber,rank,totalpageviews,gallery',
    sort: 'objectnumber.exact',
    page: 1
  };

  let objects = [];
  let data;

  do {
    data = await HAM.Objects.search(criteria);
    objects = objects.concat(data.records)
    criteria.page += 1;
  } while (criteria.page <= data.info.pages);

  let now = new Date();
    
  for (let r of objects) {
      // is the object in the future minded exhibition???
      r.futureminded = 0;
      if (list.includes(r.id)) {
        r.futureminded = 1;
      }

      // calculate the age of the object
      if (r.datebegin && r.dateend) {
        r.age = now.getFullYear() - ((r.datebegin + r.dateend)/2);
      }
  
      // split hex colors to rgb
      if (r.colors) {
        let max = 0;
        r.colors.forEach(c => {
          c.percentScaled = Math.floor(c.percent*1000000);
          max += c.percentScaled;
        });
  
        r.colors.forEach(c => {
          c.percentRounded = Math.floor(Math.abs((((c.percentScaled - 0) * (100 - 1)) / (max - 0)) + 1));
          // colors.map(c => (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin; )
  
          let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c.color);
          c.r = parseInt(result[1], 16);
          c.g = parseInt(result[2], 16);
          c.b = parseInt(result[3], 16)
        });
      }
  };

  // objects = _.orderBy(objects, "accessionyear", "desc");
  let groups = _.groupBy(objects, "accessionyear");
  
  let output = {
    acquisitioncount: objects.length.toLocaleString(),
    groups: groups,
    years: _.keys(groups)
  };

  res.render('year', {layout: '../../core/views/layout.hbs', title: 'Acquisitions Explorer | Explorator | Harvard Art Museums', data:output });
});

module.exports = router;