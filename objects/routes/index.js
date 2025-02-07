var router = require("express-promise-router")();
const ham  = require('@harvardartmuseums/ham');
const _ = require('lodash');


let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Objects Explorer | Explorator | Harvard Art Museums' });
});

router.get('/stats', async function(req, res, next) {
    let criteria = {
        size: 0,
        q: 'accesslevel:1'
    }
    
    if (req.query.department) {
      criteria.q += ` AND department:"${req.query.department}"`;  
    }

    if (req.query.year) {
      criteria.q += ` AND accessionyear:>=${req.query.year}`;
    } else {
      criteria.q += ' AND accessionyear:>=2000';
    }

    if (req.query.exclude) {
      criteria.q += ` AND !(accessionmethod: ${req.query.exclude})`;
    }

    if (req.query.include) {
      criteria.q += ` AND accessionmethod: "${req.query.include}"`;
    }

    let aggs = {
        "by_year": {
          "terms": {
            "field": "accessionyear",
            "size": 100,
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
            },
            "by_division": {
              "terms": {
                "field": "division",
                "size": 10
              }
            }, 
            "by_department": {
              "terms": {
                "field": "department",
                "size": 20
              }
            },                        
            "by_accessionmethod": {
              "terms": {
                "field": "accessionmethod",
                "size": 20
              }
            },
            "by_classification": {
              "terms": {
                "field": "classification.exact",
                "size": 100
              }
            }
          }
        }

    };

    let data = await HAM.Objects.search(criteria, aggs);
    data.info.totalrecordsString = data.info.totalrecords.toLocaleString();

    // console.log(data.aggregations.by_year.buckets[0].colors.by_color.buckets)
    res.render('stats', {layout: '../../core/views/layout.hbs', title: 'Acquisitions Explorer | Explorator | Harvard Art Museums', stats: data });
});

router.get('/visualize/:yearfrom-:yearto', async function(req, res, next) {
  let criteria = {
    q: `accesslevel:1 AND accessionyear:>=${req.params.yearfrom} AND accessionyear:<=${req.params.yearto}`,
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
    yearrange: {
      start: req.params.yearfrom,
      end: req.params.yearto
    },
    groups: groups,
    years: _.keys(groups)
  };

  res.render('year', {layout: '../../core/views/layout.hbs', title: 'Acquisitions Explorer | Explorator | Harvard Art Museums', data:output });
});

router.get('/ancient', async function(req, res, next) {
    let params = {
        q: `accesslevel:1 AND department:"Department of Ancient and Byzantine Art & Numismatics"`,
        size:100,
        sort: 'random'
    }
    let aggs = {
      'by_floor': {
          "terms": {
            "field": "gallery.floor",
            "size": 10,
            "order": { "_key": "asc" }     
        }
      },
      "by_accessionmethod": {
        "terms": {
          "field": "accessionmethod",
          "size": 20
        }
      },
      "by_classification": {
        "terms": {
          "field": "classification.exact",
          "size": 100
        }
      }, 
      "by_pageviews": {
        "range": {
          "field": "totalpageviews",
          "keyed": true,
          "ranges": [
            { "key": "None", "to": 1 },
            { "key": "Some", "from": 1, "to": 10 },
            { "key": "Many", "from": 10, "to": 1000 },
            { "key": "Very Many", "from": 1000, "to": 5000 },
            { "key": "A Lot", "from": 5000 },
          ]
        }                
      },
      "by_exhibitioncount": {
        "range": {
          "field": "exhibitioncount",
          "keyed": true,
          "ranges": [
            { "key": "None", "to": 1 },
            { "key": "Some", "from": 1, "to": 10 },
            { "key": "Many", "from": 10 }
          ]
        }
      },
      // "by_exhibitioncount": {
      //   "histogram": {
      //       "field": "exhibitioncount",
      //       "interval": 1,
      //       "order": {"_key": "desc"},
      //       "extended_bounds": {
      //         "min": 0.0,
      //         "max": 20.0
      //       }
      //   }
      // }
    }
    let objects = await HAM.Objects.search(params, aggs);

    objects.info.totalrecordsString = objects.info.totalrecords.toLocaleString();

    for (let r of objects.records) {
      if (r.primaryimageurl === undefined) {
        r.primaryimageurl = '/images/Image-Unavailable.jpg';
      } else {
        r.primaryimageurl += ':IMAGE/square/!150,150/0/default.jpg';	
      }
      if (r.colors === undefined) {
        r.primarycolor = '#000000';
      } else {
        r.primarycolor = r.colors[0].color;
      }
    }

    res.render('ancient', {layout: '../../core/views/layout.hbs',  title: 'Objects Explorer | Explorator | Harvard Art Museums', objects: objects});
})

module.exports = router;