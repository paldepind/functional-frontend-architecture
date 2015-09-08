/* globals window, document */

import curry from 'ramda/src/curry'
import compose from 'ramda/src/compose'
import map from 'ramda/src/map'
import chain from 'ramda/src/chain'
import identity from 'ramda/src/identity'
import invoker from 'ramda/src/invoker'
import ifElse from 'ramda/src/ifElse'
import path from 'ramda/src/path'
import props from 'ramda/src/props'
import prop from 'ramda/src/prop'
import assoc from 'ramda/src/assoc'
import equals from 'ramda/src/equals'
import prepend from 'ramda/src/prepend'
import insert from 'ramda/src/insert'
import join from 'ramda/src/join'
import allPass from 'ramda/src/allPass'

import Type from 'union-type'

import Future from 'ramda-fantasy/src/Future'
import Maybe from 'ramda-fantasy/src/Maybe'

import forwardTo from 'flyd-forwardto'

import h from 'snabbdom/h'

import autocomplete from './autocomplete'
import menu from './menu'

// utils 

const rejectFut = (val) => Future((rej,res) => rej(val))
const promToFut = (prom) => Future((rej, res) => prom.then(res, rej))
const getJSON = compose( promToFut, invoker(0, 'json'))
const getUrl = (url) => promToFut(window.fetch(new window.Request(url, {method: 'GET'})))
const respIsOK = (r) => !!r.ok
const targetValue = path(['target', 'value']);
const nullEmpty = (x) => x.length === 0 ? null : x
const noFx = (s) => [s,[]]

////////////////////////////////////////////////////////////////////////////////
// app constants

const searchItem = {  // mini-component
  init: identity,
  view: ([place, state, post]) => {
    return h('div', [ h('span.place', `${place}, ${state}` ) , 
                      h('span.post', post) ] );
  }
}

const searchItemValue = ([place, state, post]) => `${place}, ${state} ${post}` 

const searchMenu = menu(searchItem, searchItemValue);
const search = autocomplete(searchMenu);


////////////////////////////////////////////////////////////////////////////////
// autocomplete query

// Object -> String -> Future (String, Array (Array String))
const query = (model) => (
  compose(
    chain( ifElse(respIsOK, parseResult, fetchFail) ),
    chain(fetchZips), 
    toParams(model)  
  )
);

const getZipsAndPlaces = (data) => {
  const placeAndZips = map( props(['place name', 'post code']), data.places);
  return map( insert(1,data['state abbreviation']), placeAndZips);
}

// Response -> Future ((), Array (Array String))
const parseResult = compose( map(getZipsAndPlaces), getJSON); 

// Response -> Future (String, ())
const fetchFail = (resp) => rejectFut("Not found");

// Array String -> Future ((), Response)
const fetchZips = ([country, state, place]) => {
  return getUrl(`http://api.zippopotam.us/${country}/${state}/${place}`);
}

// Object -> String -> Future (String, Array String)
const toParams = (model) => (str,_) => {
  return new Future( (rej, res) => {
    const stateAndPlace = parseInput(str);
    const country = model.country;
    if (stateAndPlace.length !== 2) { 
      rej("Enter place name and state or province, separated by a comma"); return; 
    }
    if (Maybe.isNothing(country))   { 
      rej("Select a country"); return; 
    }
    map((c) => res(prepend(c,stateAndPlace)), country);
  });
}

const parseInput = (str) => {
  const raw = map((part) => part.trim(), str.split(','));
  if (raw.some((part) => part.length === 0)) return [];
  return raw.reverse();
};


///////////////////////////////////////////////////////////////////////////////
// model

const init = () => (
  {
    message: Maybe.Nothing(),
    country: Maybe.Nothing(),
    search: search.init() 
  }
);


// update

const Action = Type({
  SetCountry: [String],
  Search: [search.Action]
});

const update = Action.caseOn({
  
  SetCountry: (str,model) => (
    noFx( assoc('country', Maybe(nullEmpty(str)), model) )
  ),

  Search: (action,model) => {
    const [s,tasks] = search.update(action, model.search);
    return [ 
      assoc('search', s, model),
      map( (t) => t.bimap(Action.Search, Action.Search), tasks)  
    ];
  }
});

// view

const view = curry( ({action$}, model) => (
  h('div#app', [
    h('h1', 'Zip codes autocomplete example'),
    h('h2', header(model)),
    h('div.country', [
      h('label', {attrs: {'for': 'country'}}, 'Country'),
      countryMenu(action$, ['', 'DE','ES','FR','US'])
    ]),
    search.view(
      { action$: forwardTo(action$, Action.Search), 
        query:   query(model)
      },
      model.search
    )
  ])
));

const header = (model) => (
  model.country.isNothing() ? "Select a country"
                            : model.search.isEditing ? ""
                            : "Enter a place and state or province, separated by a comma"
)

const countryMenu = (action$, codes) => (
  h('select', {
      on: {
        change: compose(action$, Action.SetCountry, targetValue) 
      }
    },
    map( (code) => h('option',code) , codes) 
  )
);


export default {init, update, Action, view, search, searchMenu, query}
