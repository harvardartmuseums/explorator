var express = require('express');
var router = express.Router();

/* GET most viewed online page. */
router.get('/most-viewed', function(req, res, next) {
  res.render('analytics-most-viewed-online', {layout: 'layout.hbs', title: 'Most Viewed Online' });
});

module.exports = router;
