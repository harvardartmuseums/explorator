var router = require("express-promise-router")();
const ham  = require('@harvardartmuseums/ham');
const nlp = require('compromise');
const apicache = require('apicache');

let cache = apicache.middleware;

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Exhibition Explorer | Explorator | Harvard Art Museums' });
});

  /* GET the exhibition browse page. */
router.get('/browse', function(req, res, next) {
    res.render('browse', {layout: '../../core/views/layout.hbs', title: 'Browse | Exhibition Explorer | Explorator | Harvard Art Museums'});
});

/* GET the exhibition timeline page. */
router.get('/timeline', function(req, res, next) {
    res.render('timeline', {layout: '../../core/views/layout.hbs', title: 'Timeline | Exhibition Explorer | Explorator | Harvard Art Museums'});
});

router.get('/data/timeline', async function(req, res, next) {
  let criteria = {
    venue: "HAM",
    sort: "chronological",
    sortorder: "desc",
    size: 100
  }

  if (req.query.start) {
    criteria.before = req.query.end;
    criteria.after = req.query.start;
  }
  let exhibitions = await HAM.Exhibitions.search(criteria);
     
  let events = [];

  exhibitions.records.forEach(d => {
      var startDate = new Date(d.begindate);
      var endDate = new Date(d.enddate);
      var e = {
        unique_id: d.id
      };
      e.text = {
        headline: d.title,
        text: `<a href="/exhibitions/${d.id}">Learn more about this exhibition</a>`
      };
      // if (d.description) {
      //   e.text.text =  d.description;
      // }
      e.start_date = {
        year: startDate.getFullYear(),
        month: startDate.getMonth()+1,
        day: startDate.getDate()+1
      };
      e.end_date = {
        year: endDate.getFullYear(),
        month: endDate.getMonth()+1,
        day: endDate.getDate()+1             
      };
      if (d.poster) {
        e.media = {
          url: d.poster.imageurl
        };
      }
      
      events.push(e);            
  });

  res.json(events);
});

router.get('/floorplan', async function(req, res, next) {
  let params = {
    venue: "HAM",
    after: "begindate:2014-11-15",
    size:100,
    sort: "chronological"
  }
  let exhibitions = await HAM.Exhibitions.search(params)
  res.render('floorplan', {layout: '../../core/views/layout.hbs', title: 'Floorplan Explorer | Explorator | Harvard Art Museums', data: exhibitions.records });
});

router.get('/know-your-exhibition', cache('20 hours'), async function(req, res, next) {
  let params = {
    venue: "HAM",
    after: "begindate:2014-11-15",
    size:100,
    sort: "chronological"
  }
  let data = await HAM.Exhibitions.search(params)
  let exhibitions = data.records;

  // process date below
  for (let i = 0; i < exhibitions.length; i++){
    let image = await HAM.Images.get(exhibitions[i].images[0].imageid);
    if (image.colors) {

      let steps = [];
      let stop = 0;

      let max = 0;
      image.colors.forEach(c => {
          c.percentScaled = Math.floor(c.percent*1000000);
          max += c.percentScaled;
      });
      image.colors.forEach(c => {
          c.percentRounded = Math.floor(Math.abs((((c.percentScaled - 0) * (100 - 1)) / (max - 0)) + 1));
          // colors.map(c => (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin; )

          let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c.color);
          c.r = parseInt(result[1], 16);
          c.g = parseInt(result[2], 16);
          c.b = parseInt(result[3], 16)        
      });
      image.colors.forEach((c, i) => {    
        if (i>0) stop += Math.round(image.colors[i-1].percentRounded);
        // a stupid hack to clamp the percents at the upper end between 1 and 100
        if (stop>=90) stop = stop - (stop - 100 + (image.colors.length-i)) + 1;
        steps.push(`rgba(${c.r},${c.g},${c.b},1) ${stop}%`);
      })  
      image.gradient = `linear-gradient(90deg, ${steps.toString()})`;      
    }
    exhibitions[i].poster.details = image; 

    let begin = exhibitions[i].begindate.split("-");
    exhibitions[i].beginYear = parseInt(begin[0]);
    exhibitions[i].beginMonth = parseInt(begin[1]);
    
    let end = exhibitions[i].enddate.split("-");
    exhibitions[i].endYear = parseInt(end[0]);
    exhibitions[i].endMonth = parseInt(end[1]);

    let doc = nlp(exhibitions[i].description);
    exhibitions[i].lead = doc.sentences(0).text();
  }

  // process and delete the exhibits not on floor 3
  function notOnFloorThree(exhibit) {
    return exhibit.venues[0].galleries[0].floor === "3";
  }
  exhibitions = exhibitions.filter(notOnFloorThree);

  res.render('know-your-exhibition', {layout: '../../core/views/layout.hbs', title: 'Know Your Exhibition | Explorator | Harvard Art Museums', data: exhibitions });
});

router.get('/:id', async function(req, res, next) {
  let exhibition = await HAM.Exhibitions.get(req.params.id);

  let objects = await HAM.Objects.search({exhibition: exhibition.id, size: 0});
  exhibition.objectcount = objects.info.totalrecords; 

  objects = await HAM.Objects.search({exhibition: exhibition.id, hasimage: 1, sort: 'random', q: 'imagepermissionlevel:0'});
  exhibition.objects = objects.records;
  
  res.render('details', {layout: '../../core/views/layout.hbs', title: 'Exhibition Explorer | Explorator | Harvard Art Museums', exhibition: exhibition });
});

module.exports = router;
