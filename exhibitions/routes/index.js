var router = require("express-promise-router")();
const ham  = require('@harvardartmuseums/ham');
const nlp = require('compromise');
const apicache = require('apicache');
const _ = require('lodash');

let cache = apicache.middleware;

let HAM = new ham(process.env.apikey);
let HAM_OWNER = new ham(process.env.apikey_owner);

async function getArticles(exhibitionID) {
  let url = `https://harvardartmuseums.org/exhibitions/${exhibitionID}/articles/json`;
  let response = await fetch(url);
  let articles = response.json();

  return articles;
}

async function getEvents(exhibitionID) {
  let url = `https://harvardartmuseums.org/calendar/json?exhibition_id=${exhibitionID}`;
  let response = await fetch(url);
  let events = response.json();

  return events;
}

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
  let data = await HAM_OWNER.Exhibitions.search(params)
  let exhibitions = data.records;

  // process date below
  for (let i = 0; i < exhibitions.length; i++){
    let image = await HAM_OWNER.Images.get(exhibitions[i].images[0].imageid);
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

  articles = await getArticles(exhibition.id);
  exhibition.articles = articles;

  events = await getEvents(exhibition.id);
  exhibition.eventcount = events.length;
  events = _.groupBy(events, "event_type");
  
  exhibition.events = events;
  
  res.render('details', {layout: '../../core/views/layout.hbs', title: 'Exhibition Explorer | Explorator | Harvard Art Museums', exhibition: exhibition });
});


router.get('/:id/timeline', async function (req, res, next) {
  let exhibition = await HAM.Exhibitions.get(req.params.id);

  articles = await getArticles(exhibition.id);
  events = await getEvents(exhibition.id);
    
  let timeline_events = [];

  exhibition.venues.forEach(d => {
    var startDate = new Date(d.begindate);
    var endDate = new Date(d.enddate);
    var e = {
      unique_id: `${exhibition.id}-v-${d.venueid}`
    };
    e.text = {
      headline: `On view at ${d.fullname}`,
      text: `A venue`
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
    timeline_events.push(e);            
  });

  events.forEach(d => {
    var startDate = new Date(d.date);
    var e = {
      unique_id: `${exhibition.id}-e-${d.id}`
    };
    e.text = {
      headline: d.title,
    };
    if (d.summary) {
      e.text.text =  d.summary;
    }
    e.text.text += `<p><a href="https://harvardartmuseums.org/calendar/${d.slug}">View the event details</a></p>`;
    e.start_date = {
      year: startDate.getFullYear(),
      month: startDate.getMonth()+1,
      day: startDate.getDate()+1
    };
    // e.end_date = {
    //   year: endDate.getFullYear(),
    //   month: endDate.getMonth()+1,
    //   day: endDate.getDate()+1             
    // };
    timeline_events.push(e);            
  });


  articles.forEach(d => {
    var startDate = new Date(d.article.date);
    var e = {
      unique_id: `${exhibition.id}-a-${d.article_id}`
    };
    e.text = {
      headline: d.article.title,
    };
    if (d.article.summary) {
      e.text.text =  d.article.summary;
    }
    e.text.text += `<p><a href="https://harvardartmuseums.org/article/${d.article.slug}">Read the article</a></p>`
    e.start_date = {
      year: startDate.getFullYear(),
      month: startDate.getMonth()+1,
      day: startDate.getDate()+1
    };
    e.media = {
      url: d.article.image_file,
      caption: '',
      credit: ''
    };
    timeline_events.push(e);            
  });

  res.json(timeline_events);
});

module.exports = router;
