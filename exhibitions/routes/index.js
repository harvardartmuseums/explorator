const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET the main image page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: '../../core/views/layout.hbs', title: 'Exhibition Explorer | Explorator | Harvard Art Museums' });
});

/* GET the exhibition timeline page. */
router.get('/timeline', function(req, res, next) {
    res.render('timeline', {layout: '../../core/views/layout.hbs', title: 'Timeline | Exhibition Explorer | Explorator | Harvard Art Museums'});
});

router.get('/data/timeline', function(req, res, next) {
  let criteria = {
    venue: "HAM",
    sort: "chronological",
    sortorder: "desc",
    size: 100
  }
  HAM.Exhibitions.search(criteria)
     .then(data => {
        let events = [];

        data.records.forEach(d => {
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
});

module.exports = router;
