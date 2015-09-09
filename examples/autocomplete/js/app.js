/* globals window */

import curry from 'ramda/src/curry'
import compose from 'ramda/src/compose'
import map from 'ramda/src/map'
import chain from 'ramda/src/chain'
import identity from 'ramda/src/identity'
import unary from 'ramda/src/unary'
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

const isMaybe = (val) => Maybe.isNothing(val) || Maybe.isJust(val)
const maybeEmpty = (val) => val.length === 0 ? Maybe.Nothing() : Maybe(val)
const rejectFut = (val) => Future((rej,res) => rej(val))
const errorOr = (fn) => (val) => (val instanceof Error ? val : fn(val))
const promToFut = (prom) => Future((rej, res) => prom.then(res, rej))
const getJSON = compose( promToFut, invoker(0, 'json'))
const getUrl = (url) => promToFut(window.fetch(new window.Request(url, {method: 'GET'})))
const respIsOK = (r) => !!r.ok
const targetValue = path(['target', 'value']);
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
    unary(toParams(model))
  )
);

const getZipsAndPlaces = (data) => {
  const placeAndZips = map( props(['place name', 'post code']), data.places);
  return map( insert(1,data['state abbreviation']), placeAndZips);
}

// Response -> Future ((), Array (Array String))
const parseResult = compose( map(getZipsAndPlaces), getJSON); 

// Response -> Future (String, ())
const fetchFail = (resp) => rejectFut("Not found, check your spelling.");

// Array String -> Future ((), Response)
const fetchZips = ([country, state, place]) => {
  return getUrl(`http://api.zippopotam.us/${country}/${state}/${place}`);
}

// Object -> Maybe String -> Future (String, Array String)
const toParams = (model) => (str) => {
  return new Future( (rej, res) => {
    const stateAndPlace = parseInput(str);
    const country = model.country;
    if (Maybe.isNothing(stateAndPlace)) { 
      rej("Enter place name and state or province, separated by a comma"); return; 
    }
    if (Maybe.isNothing(country))   { 
      rej("Select a country"); return; 
    }
    map((c) => 
      map((s) => 
        res(prepend(c,s)), 
        stateAndPlace
      ), 
      country
    );
    return;
  });
}

const parseInput = (str) => (
  chain(
    validateStateAndPlace,
    map(parseStateAndPlace, str)
  )
);

const parseStateAndPlace = (s) => (
  s.split(',')
   .map(invoker(0,'trim'))
   .reverse()
);

const validateStateAndPlace = (parts) => (
  (parts.length < 2 || 
   parts.some((p) => p.length === 0)) ? Maybe.Nothing()
                                      : Maybe(parts.slice(0,2))
);



///////////////////////////////////////////////////////////////////////////////
// model

const init = () => ({
  message: Maybe(initMessage),
  country: Maybe.Nothing(),
  search: search.init() 
});

const initMessage = "Select a country, and enter a place name."

const headerMessage = (model) => (
  model.message.getOrElse(initMessage)
)

// update

const Action = Type({
  SetCountry: [isMaybe],
  Search: [search.Action],
  SearchResultOk: [Array],
  SearchResultErr: [String]
});

const update = Action.caseOn({
  
  SetCountry: (str,model) => (
    noFx( assoc('message', (str.isNothing() ? Maybe(initMessage) : model.message),
            assoc('country', str, model) 
          ))
  ),

  Search: (action,model) => {
    const [s,tasks] = search.update(action, model.search);
    return [ 
      assoc('search', s, model),
      map( (t) => t.bimap( errorOr(Action.SearchResultErr), Action.SearchResultOk), 
           tasks
      )  
    ];
  },

  SearchResultOk: (results, model) => {
    const count = results.length;
    const [s,_] = search.update(search.Action.RefreshMenu(results), model.search);
    return noFx(assoc('message', Maybe.Just(`${count} postal codes found.`), 
                  assoc('search', s, model)
                ));
  },
  
  SearchResultErr: (message, model) => {
    const [s,_] = search.update(search.Action.ClearMenu(), model.search);
    return noFx(assoc('message', Maybe.Just(message), 
                  assoc('search', s, model)
                ));
  }

});

// view

const view = curry( ({action$}, model) => (
  h('div#app', [
    h('h1', 'Postal codes autocomplete example'),
    h('h2', headerMessage(model)),
    h('div.country', [
      h('label', {attrs: {'for': 'country'}}, 'Country'),
      countryMenuView(action$, ['', 'DE','ES','FR','US'])
    ]),
    search.view(
      { action$: forwardTo(action$, Action.Search), 
        query:   query(model)
      },
      model.search
    )
  ])
));


const countryMenuView = (action$, codes) => (
  h('select', {
      on: {
        change: compose(action$, Action.SetCountry, maybeEmpty, targetValue) 
      }
    },
    map( (code) => h('option',code) , codes) 
  )
);

// note: extra exports for testing

export default {init, update, Action, view, search, searchMenu, query}
