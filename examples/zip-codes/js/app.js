/* jshint esnext: true */
/* globals require, window, Request */
'use strict';

/* This is a translation of Elm's zip-codes example, designed to show how
   to use asyncronous tasks, specifically http requests. ES6 Promises are used
   here as stand-ins for Elm's Tasks. 

   Original: http://elm-lang.org/examples/zip-codes
*/

const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const Type = require('union-type');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
]);
const h = require('snabbdom/h');


// view

const view = (model, result) => {
  
  const field = h('input', {
      props: {  placeholder: 'Zip Code', value: model },
      style: myStyle,
      on: { input:  R.pipe( targetValue, query$) } 
    },
    []
  )
 
  const messages = Result.case({
    Ok:  R.map((city) => h('div', {style: myStyle}, city)),
    Err: (msg) => [ h('div', { style: myStyle }, msg) ]
  }, result);
  
  return h('div', {}, R.prepend(field, messages));
}

const myStyle =
    { "width": "100%"
      , "height": "40px"
      , "padding": "10px 0"
      , "font-size": "2em"
      , "text-align": "center"
    };
 
// wiring

const Result = Type({
  Ok: [Array],
  Err: [String]
})

const query$ = stream("");
const result$ = stream(Result.Err("A valid US zip code is 5 numbers."));

const vnode$ = map2( view, query$, result$ );

const request$ = flyd.map( 
  R.pipe( lookupZipCode, result$ ), 
  query$
)

module.exports = function start(container){
  flyd.scan( patch, container, vnode$ )
}



function lookupZipCode(query){
  const makeRequest = function(){
    if (query.match(/^\d{5}$/)) { 
      return window.fetch( new Request("http://api.zippopotam.us/us/" + query, {method: 'GET'}) );
    } else { 
      return Promise.reject( "Give me a valid US zip code!" ); 
    }
  }

  return makeRequest()
           .then( responseStatus )    
           .then( R.invoker(0,'text') )
           .then( places )
           .then( Result.Ok, Result.Err )
}

function places(text){
  const place = (obj) => obj['place name'] + ', ' + obj['state']
  return JSON.parse(text)['places'].map(place)
}


// utils

function targetValue(e){  return e.target.value; }


// cf. http://updates.html5rocks.com/2015/03/introduction-to-fetch
function responseStatus(response){
  if (!response.ok) return Promise.reject("Not found :(");
  return Promise.resolve(response);
}

function map2(fn, s1, s2){
  return flyd.stream([s1,s2], function(){
    return fn(s1(), s2());
  })
}
