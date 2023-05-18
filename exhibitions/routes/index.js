var router = require("express-promise-router")();
const ham  = require('@harvardartmuseums/ham');

let HAM = new ham(process.env.apikey);

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Exhibition Explorer | Explorator | Harvard Art Museums' });
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
  let exhibitions = await HAM.Exhibitions.search(criteria);
     
  let events = [];

  exhibitions.records.forEach(d => {
      var startDate = new Date(d.begindate);
      var endDate = new Date(d.enddate);
      var e = {};
      e.text = {
        headline: d.title
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

module.exports = router;
