var apicache = require('apicache');
var router = require("express-promise-router")();
var ham = require('@harvardartmuseums/ham');

let HAM = new ham(process.env.apikey);
let HAM_STAGING = new ham(process.env.apikey);
HAM_STAGING.baseurl = 'https://staging.api.harvardartmuseums.org';

var cache = apicache.middleware;

var apikey = process.env.APIKEY;
var apiURL = "https://api.harvardartmuseums.org";

router.get('/:endpoint', cache('12 hours'), async function(req, res, next) {
    let qs = {
        parameters: {},
        aggregations: {}
    };

    let useStaging = false;

    for (var param in req.query) {
        if (param == 'aggregation' || param == 'aggregations') {
            qs.aggregations = JSON.parse(req.query[param]);
        } else if (param == 'env' && req.query[param] == 'staging') {
            useStaging = true;
        } else {
            qs.parameters[param] = req.query[param];
        }
    }

    let client = useStaging ? HAM_STAGING : HAM;
    let results = await client.search(req.params.endpoint, qs.parameters, qs.aggregations);
    res.json(results);
});

router.get('/:endpoint/:id', cache('12 hours'), async function(req, res, next) {
    let results = await HAM.get(req.params.endpoint, req.params.id);
    res.json(results);
});

router.get('/object/:id/activities/by/month', async function(req, res, next) {
	let maxYear = new Date().getFullYear();

    const aggregations = {
        activities: {
            terms: {
                field: "activitytype",
                size: 10
            },
            aggs: {
                by_month: {
                    date_histogram: {
                        field: "date",
                        calendar_interval: "month",
                        format: "yyy-MM",
                        min_doc_count: 0,
                        extended_bounds: {
                            min: "2009-01",
                            max: `${maxYear}-12`
                        }
                    },
                    aggs: {
                        totals: {
                            sum: {
                                field: "activitycount"
                            }
                        }
                    }
                }
            }
        }
    };

    const params = {
        size: 0,
        object: parseInt(req.params.id)
    };

    let results = await HAM.Activities.search(params, aggregations);
    res.json(results.aggregations);
});

module.exports = router;
