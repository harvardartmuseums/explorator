const HAM = require('@harvardartmuseums/ham');
const nlp = require('compromise');
const storyWriter = require('./story-writer');
let _ = require('lodash');

let api = new HAM(process.env.apikey);
    
const dateOfMuseumOpening = new Date("2014-11-16");
const now = new Date();
const daysSinceMuseumOpened = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(dateOfMuseumOpening.getFullYear(), dateOfMuseumOpening.getMonth(), dateOfMuseumOpening.getDate()) ) /(1000 * 60 * 60 * 24));

let cache = {};

async function build(id) {
    let exhibitionIdList = [];
    let publicationsIdList = [];

    let artwork = await api.Objects.get(id);
    
    // get the openai description
    if (artwork.images.length > 0) {
        let criteria = {
            q: 'source:"Azure OpenAI Service" OR "Anthropic"',
            fields: 'body,source,model',
            image: artwork.images[0].imageid
        };
        let annotations = await api.Annotations.search(criteria);
        if (annotations.info.totalrecords > 0) {
            let openai = _.filter(annotations.records, {source: "Azure OpenAI Service"})
            if (openai.length > 0) {
                artwork.openai = openai[0].body;
            }
            let anthropic = _.filter(annotations.records, {source: "Anthropic"})
            if (anthropic.length > 0) {
                artwork.anthropic = anthropic[0].body;
            }            
        }
    }
    // get the exhibition ids
    if (artwork.exhibitions) {
        exhibitionIdList = exhibitionIdList.concat(artwork.exhibitions.map(v => v.exhibitionid));
    }
    // get the publication ids
    if (artwork.publications) {
        publicationsIdList = publicationsIdList.concat(artwork.publications.map(v => v.publicationid));
    }
    // calculate the age of the object
    if (artwork.datebegin && artwork.dateend) {
        artwork.age = now.getFullYear() - ((artwork.datebegin + artwork.dateend)/2);
        if (artwork.datebegin !== artwork.dateend) {
        artwork.agequalifier = 'about';
        }

        if (artwork.accessionyear) {
        artwork.ageatacquisition = artwork.age - (now.getFullYear() - artwork.accessionyear);
        }
    }
    // calculate the number of previous owners
    artwork.provenancecount = 0;
    if (artwork.provenance) {
        // try to count the number of entries in the provenance description
        artwork.provenancecount = (artwork.provenance.match(/\r\n/g) || []).length;

        let doc = nlp(artwork.provenance);
        artwork.provenance = {
        text: artwork.provenance,
        topics: doc.topics().people().json()
        };
    }
    // calculate the object popularity
    artwork.popularity = 0;


    // try to extract the dimensions of the painting only (not frame)
    if (artwork.dimensions) {
        let endIndex = artwork.dimensions.indexOf("framed");
        if (endIndex !== -1) {
        // Extract the content before "framed" 
        artwork.dimNoFrame = artwork.dimensions.substring(0, endIndex);
        } else {
        endIndex = artwork.dimensions.indexOf("frame");
        if (endIndex !== -1){
            artwork.dimNoFrame = artwork.dimensions.substring(0, endIndex);
        }
        }
    }

    // split hex colors to rgb
    if (artwork.colors) {
        let max = 0;
        artwork.colors.forEach(c => {
            c.percentScaled = Math.floor(c.percent*1000000);
            max += c.percentScaled;
        });
    
        artwork.colors.forEach(c => {
            c.percentRounded = Math.floor(Math.abs((((c.percentScaled - 0) * (100 - 1)) / (max - 0)) + 1));
            // colors.map(c => (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin; )
    
            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c.color);
            c.r = parseInt(result[1], 16);
            c.g = parseInt(result[2], 16);
            c.b = parseInt(result[3], 16)
        });
    }

    // fetch details about the gallery
    if (artwork.gallery) {
        // calculate the # of days on view
        const dt1 = new Date(artwork.gallery.begindate);
        artwork.gallery.age = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()) ) /(1000 * 60 * 60 * 24));

        let gallery = await api.Galleries.get(artwork.gallery.galleryid);
        artwork.gallery.details = gallery; // can add gallery to line 46
    }

    // fetch activities for the object
    artwork.activity = await getObjectActivityByYear(artwork.objectid);

    const stories = storyWriter(artwork);
    artwork.stories = Object.assign({}, stories);

    // append a "pretty print" version of the raw JSON; use to display the JSON directly on a web page
    // artwork.raw = JSON.stringify(artwork, null, "\t");

    return artwork
}

async function getObjectActivityByYear(objectid) {
    let now = new Date();
      
    let aggActivities = {
      "activities": {
        "terms": { 
          "field": "activitytype",
          "size": 10
        },
        "aggs": {
          "by_year": {
            "date_histogram": {
              "field": "date",
              "calendar_interval": "year",
              "format": "yyy",
              "min_doc_count": 0,
              "extended_bounds": {
                "min": "2009",
                "max": now.getFullYear().toString() 
              }
            },
            "aggs": {
              "totals": {
                "sum": {
                  "field": "activitycount"
                }
              }
            }
          }
        }
      }
    };    

    let q = {
        'size': 0,
        'object': objectid
    };
    
    let data = await api.Activities.search(q, aggActivities)
    return data.aggregations.activities.buckets;    
}

async function getObject(id) {
    if (cache[id]) {
        return cache[id].data;
    } else {
        let object = await build(id);

        // cache the object record
        cache[id] = {
            createdate: new Date().toISOString(),
            data: object
        };     

        return object;
    }
}

module.exports = {
    getObject: getObject, 
};