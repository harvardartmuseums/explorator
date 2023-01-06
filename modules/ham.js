const fetch = require('node-fetch');
const querystring = require('querystring');

const API_KEY = process.env.APIKEY;
const API_BASE_URL = 'https://api.harvardartmuseums.org'

const ENDPOINTS = {
    exhibitions: 'exhibition',
    images: 'image', 
    audio: 'audio', 
    videos: 'video', 
    objects: 'object',
    people: 'person',
    galleries: 'gallery',
    publications: 'publication',
    annotations: 'annotation',
    spectrum: 'spectrum',
    sites: 'site',
    activities: 'activity'
};

function _makeSearchUrl(endpoint, parameters, aggregations) {
  let qs = {
    apikey: API_KEY
  };

  if (parameters) {
    qs = {...qs, ...parameters};
  };

  if (aggregations) {
   qs.aggregation = JSON.stringify(aggregations);
  }

  return `${API_BASE_URL}/${endpoint}?${querystring.encode(qs)}`; 
}

function _makeGetUrl(endpoint, id) {
    let qs = {
        apikey: API_KEY
    };    

    return `${API_BASE_URL}/${endpoint}/${id}?${querystring.encode(qs)}`; 
}

function _fetch(url) {
    return fetch(url)
                .then(response => response.json())
                .then(response => response);
}

let Images = {
    get: (id) => { 
        return _fetch(_makeGetUrl(ENDPOINTS.images, id)); 
    },     
    search: (parameters, aggregations) => { 
        return _fetch(_makeSearchUrl(ENDPOINTS.images, parameters, aggregations)); 
    }
}

let Audio = {
    get: (id) => { 
        return _fetch(_makeGetUrl(ENDPOINTS.audio, id)); 
    },     
    search: (parameters, aggregations) => { 
        return _fetch(_makeSearchUrl(ENDPOINTS.audio, parameters, aggregations)); 
    }
}

let Videos = {
    get: (id) => { 
        return _fetch(_makeGetUrl(ENDPOINTS.videos, id)); 
    },     
    search: (parameters, aggregations) => { 
        return _fetch(_makeSearchUrl(ENDPOINTS.videos, parameters, aggregations)); 
    }
}

let Objects = {
    get: (id) => {
        return _fetch(_makeGetUrl(ENDPOINTS.objects, id));
    },     
    search: (parameters, aggregations) => {
        return _fetch(_makeSearchUrl(ENDPOINTS.objects, parameters, aggregations));
    }
}

let Exhibitions = {
    get: (id) => {
        return _fetch(_makeGetUrl(ENDPOINTS.exhibitions, id));
    },     
    search: (parameters, aggregations) => {
        return _fetch(_makeSearchUrl(ENDPOINTS.exhibitions, parameters, aggregations));
    }
}

let Publications = {
    get: (id) => {
        return _fetch(_makeGetUrl(ENDPOINTS.publications, id));
    },     
    search: (parameters, aggregations) => {
        return _fetch(_makeSearchUrl(ENDPOINTS.publications, parameters, aggregations));
    }
}

let People = {
    get: (id) => {
        return _fetch(_makeGetUrl(ENDPOINTS.people, id));
    },     
    search: (parameters, aggregations) => {
        return _fetch(_makeSearchUrl(ENDPOINTS.people, parameters, aggregations));
    }
}

let Galleries = {
    get: (id) => {
        return _fetch(_makeGetUrl(ENDPOINTS.galleries, id));
    },     
    search: (parameters, aggregations) => {
        return _fetch(_makeSearchUrl(ENDPOINTS.galleries, parameters, aggregations));
    }
}

let Annotations = {
    get: (id) => {
        return _fetch(_makeGetUrl(ENDPOINTS.annotations, id));
    },     
    search: (parameters, aggregations) => {
        return _fetch(_makeSearchUrl(ENDPOINTS.annotations, parameters, aggregations));
    }
}


module.exports = {
    Exhibitions: Exhibitions,
    Images: Images,
    Objects: Objects,
    People: People,
    Publications: Publications,
    Audio: Audio,
    Videos: Videos,
    Galleries: Galleries,
    Annotations: Annotations
};