var apicache = require('apicache');
var router = require("express-promise-router")();
var ham = require('@harvardartmuseums/ham');

let HAM = new ham(process.env.apikey);

var cache = apicache.middleware;

var apikey = process.env.APIKEY;
var apiURL = "https://api.harvardartmuseums.org";

router.get('/:endpoint', cache('12 hours'), async function(req, res, next) {
    let qs = {
        parameters: {},
        aggregations: {}
    };

    for (var param in req.query) {
        if (param == 'aggregation') {
            qs.aggregations = JSON.parse(req.query[param]);
        } else {
            qs.parameters[param] = req.query[param];
        }
    }

    let results = await HAM.search(req.params.endpoint, qs.parameters, qs.aggregations);
    res.json(results);
});

router.get('/:endpoint/:id', cache('12 hours'), async function(req, res, next) {
    let results = await HAM.get(req.params.endpoint, req.params.id);
    res.json(results);
});

module.exports = router;
