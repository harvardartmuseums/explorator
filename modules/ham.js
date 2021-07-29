const fetch = require('node-fetch');
const querystring = require('querystring');
const { response } = require('express');

const API_KEY = process.env.APIKEY;
const API_BASE_URL = 'https://api.harvardartmuseums.org'

const ENDPOINTS = {
    exhibitions: 'exhibition',
    images: 'image', 
    objects: 'object',
    people: 'person',
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

let People = {
    get: (id) => {
        return _fetch(_makeGetUrl(ENDPOINTS.people, id));
    },     
    search: (parameters, aggregations) => {
        return _fetch(_makeSearchUrl(ENDPOINTS.people, parameters, aggregations));
    }
}

module.exports = {
    Exhibitions: Exhibitions,
    Images: Images,
    Objects: Objects,
    People: People,
};