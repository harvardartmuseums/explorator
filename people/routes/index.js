var express = require('express');
var router = express.Router();
var HAM = require('../../modules/ham');

/* GET most viewed online page. */
router.get('/', function(req, res, next) {
  res.render('people-index', {layout: 'layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums' });
});

router.get('/:id', function(req, res, next) {
  let criteria =  req.params.id;
  HAM.People.get(criteria)
     .then(data => {
        res.render('people-details', {layout: 'layout.hbs', title: 'People Explorer | Explorator | Harvard Art Museums', person: data});
     });

});

module.exports = router;
