var router = require("express-promise-router")();
const ham  = require('@harvardartmuseums/ham');
const _ = require('lodash');


let HAM = new ham(process.env.apikey);

/**
 * Processes color data on a record, adding scaled/rounded percents,
 * RGB components, and a CSS linear-gradient string as `record.gradient`.
 * Mutates the record in-place. Does nothing if `record.colors` is absent.
 */
function processColors(record) {
  if (!record.colors) return;

  let max = 0;
  record.colors.forEach(c => {
    c.percentScaled = Math.floor(c.percent * 1000000);
    max += c.percentScaled;
  });

  record.colors.forEach(c => {
    c.percentRounded = Math.floor(Math.abs((((c.percentScaled - 0) * (100 - 1)) / (max - 0)) + 1));
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c.color);
    c.r = parseInt(result[1], 16);
    c.g = parseInt(result[2], 16);
    c.b = parseInt(result[3], 16);
  });

  let steps = [];
  let stop = 0;
  record.colors.forEach((c, i) => {
    if (i > 0) stop += Math.round(record.colors[i - 1].percentRounded);
    if (stop >= 90) stop = stop - (stop - 100 + (record.colors.length - i)) + 1;
    steps.push(`rgba(${c.r},${c.g},${c.b},1) ${stop}%`);
  });
  record.gradient = `linear-gradient(90deg, ${steps.toString()})`;
}

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Objects Explorer | Explorator | Harvard Art Museums' });
});

/* GET the object browse page. */
router.get('/browse', function(req, res, next) {
    res.render('object-browse', {layout: '../../core/views/layout.hbs', title: 'Browse | Object Explorer | Explorator | Harvard Art Museums'});
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
  
      processColors(r);
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
        r.primaryimageurl += '/square/!150,150/0/default.jpg';	
      }
      processColors(r);
      r.primarycolor = r.colors ? r.colors[0].color : '#000000';
    }

    res.render('ancient', {layout: '../../core/views/layout.hbs',  title: 'Objects Explorer | Explorator | Harvard Art Museums', objects: objects});
})

router.get('/:id', async function(req, res, next) {
  let object = await HAM.Objects.get(req.params.id);

  processColors(object);
  
  res.render('object-details', {layout: '../../core/views/layout.hbs', title: 'Object Explorer | Explorator | Harvard Art Museums', object: object });
});

router.get('/:id/timeline', async function(req, res, next) {
  let object = await HAM.Objects.get(req.params.id);

  let timeline_events = [];

  // Creation event
  if (object.datebegin) {
    let startYear = object.datebegin;
    let endYear   = object.dateend || object.datebegin;
    let e = {
      unique_id: `${object.id}-creation`
    };
    e.text = {
      headline: 'Created',
      text: object.dated || ''
    };
    e.start_date = { year: startYear };
    e.end_date   = { year: endYear };
    e.group = 'Creation';
    timeline_events.push(e);
  }

  // Acquisition event
  if (object.accessionyear) {
    let e = {
      unique_id: `${object.id}-acquisition`
    };
    e.text = {
      headline: 'Acquired by Harvard Art Museums',
      text: object.creditline || ''
    };
    e.start_date = { year: object.accessionyear };
    e.group = 'Acquisition';
    timeline_events.push(e);
  }

  // Exhibition events
  if (object.exhibitions && object.exhibitions.length > 0) {
    object.exhibitions.forEach(d => {
      if (!d.begindate && !d.enddate) return;

      let rawStart = d.begindate || d.enddate;
      let startDate = new Date(rawStart);
      let e = {
        unique_id: `${object.id}-ex-${d.id}`
      };
      e.text = {
        headline: d.title,
        text: ''
      };
      if (d.venues && d.venues.length > 0) {
        e.text.text = d.venues
          .map(v => `<div>${v.name}${v.city ? ', ' + v.city : ''}</div>`)
          .join('');
      }
      e.start_date = {
        year:  startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        day:   startDate.getDate()
      };
      if (d.enddate) {
        let endDate = new Date(d.enddate);
        e.end_date = {
          year:  endDate.getFullYear(),
          month: endDate.getMonth() + 1,
          day:   endDate.getDate()
        };
      }
      e.group = 'Exhibition';
      timeline_events.push(e);
    });
  }

  // Publication events
  if (object.publications && object.publications.length > 0) {
    object.publications.forEach((d, i) => {
      const year = parseInt(d.publicationyear, 10);
      if (!d.publicationyear || isNaN(year) || year <= 0) return;

      let e = {
        unique_id: `${object.id}-pub-${d.publicationid || i}`
      };
      const textParts = [];
      if (d.citation)          textParts.push(d.citation);
      if (d.format)            textParts.push(`<em>${d.format}</em>`);
      if (d.volumetitle || d.volumenumber) {
        const volParts = [d.volumetitle, d.volumenumber].filter(Boolean);
        textParts.push(volParts.join(', '));
      }
      if (d.publicationdate)   textParts.push(`Date: ${d.publicationdate}`);
      if (d.publicationplace)  textParts.push(`Published: ${d.publicationplace}`);
      if (d.pagenumbers)       textParts.push(`Pages: ${d.pagenumbers}`);
      if (d.citationremarks)   textParts.push(d.citationremarks);

      e.text = {
        headline: d.title || 'Publication',
        text: textParts.join('<br>')
      };
      e.start_date = { year };
      e.group = 'Publication';
      timeline_events.push(e);
    });
  }

  res.json(timeline_events);
});

module.exports = router;
