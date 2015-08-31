/* globals Request */

// utils 

const rejectFut = (val) => Future((rej,res) => rej(val))
const promToFut = (prom) => Future((rej, res) => prom.then(res, rej))
const getJSON = compose( promToFut, invoker(0, 'json'))
const getUrl = (url) => promToFut(fetch(new Request(url, {method: 'GET'})))
const respIsOk = (r) => r.ok === true
const targetValue = path(['target', 'value'])
const nofx = (s) => [s,[]]

// app constants

const searchItem = {  // mini-component
  init: identity,
  view: ([post,place]) => {
    return h('div', [ h('span.post', post), h('span.place', place) ] );
  }
}

const searchMenu = menu(searchItem, head);
const search = autocomplete(searchMenu);


// autocomplete query


const fetchZips = ([country, state, place]) => {
  return getUrl(`http://api.zippopotam.us/${country}/${state}/${place}`);
}

const getZipsAndPlaces = compose( map(props(['post code','place name'])), 
                                  prop('places') );

const parseZips = map(getZipsAndPlaces, getJSON); 

const failFetch = (_) => rejectFut(Action.Error("Not found"))

const lookupZipCodes = chain( ifElse(respIsOk, parseZips, failFetch), fetchZips);



///////////////////////////////////////////////////////////////////////////////

// model

const init = () => {
  return {
    message: null,
    country: null,
    search: search.init() 
  }
}


// update

const Action = Type({
  SetCountry: [String],
  Error: [String],
  Search: [Array],
  SearchRespond: [search.Action]
});

const update = Action.caseOn({
  
  SetCountry: compose(sync, assoc('country')) ,

  // hide menu as side effect, not sure what I think of this
  Error: (message,model) => {
    return [ 
      assoc('message', message, model),
      Future.of( () => Action.SearchRespond(search.Action.HideMenu()) )
    ]
  },

  Search: ([action,tasks],model) => {
    return [ 
      assoc('search', search.update(action, model.search), model),
      map( map(Action.SearchRespond), tasks)  
    ];
  },

  SearchRespond: (action,model) => {
    return nofx( 
      assoc('search', search.update(action, model.search), model) 
    );
  }

});

// view

const view = curry( ({action$}, model) => {

  const parseStateAndPlace = (str) =>  {
    return map((part) => part.trim(), str.split(',')).reverse();
  }

  const validStateAndPlace = compose(equals(2), length, parseStateAndPlace);

  // get [state, place] from input and prepend current selected country, and
  // feed that into query
  const query = compose(lookupZipCodes, 
                        prepend(model.country), 
                        parseStateAndPlace );
  
  // prevent querying if country is missing or unparseable input
  const guard = allPass( always(model.country), validStateAndPlace );

  const countryMenu = (codes) => {
    return (
      h('select', {
          on: {
            change: compose(action$, Action.SetCountry, targetValue) 
          }
        },
        map( (code) => h('option',code) , codes) 
      )
    );
  }

  const header = (model) => {
    return (model.country === null) ? "Please choose a country to search."
                                 : "Type a location to search for postal codes." ;
  }

  return  (
    h('div#app', [
      h('h2', header(model)),
      h('label', {props: {'for': 'country'}}, 'Country'),
      countryMenu(['DE','ES','FR','US']),
      search.view(
        { action$: forwardTo(action$, Action.Search), 
          query:   query,
          guard:   guard
        },
        model.search
      )
    ])
  );

});

export {init, update, Action, view}
