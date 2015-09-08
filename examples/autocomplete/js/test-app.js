import test from 'tape'
import flyd from 'flyd'

import equals from 'ramda/src/equals'
import reduce from 'ramda/src/reduce'
import prepend from 'ramda/src/prepend'
import append from 'ramda/src/append'

import Maybe from 'ramda-fantasy/src/Maybe'

import app from './app'


const throwOr = (fn) => {
  return (x) => {
    if (x instanceof Error) throw x; 
    return fn(x);
  }
}

const inspectAction = (a) => {
  const parts = reduce((acc,p) => (
      append( (Array.isArray(p) && p['name'] ? inspectAction(p) : p), acc ) 
    ), [], a);
  return prepend(a.name, parts);
}

const start = (action$, snapshots, init) => {
  const state$ = flyd.map( (act) => {
                   console.log("-->" + JSON.stringify(inspectAction(act)));
                   const [s1,tasks] = app.update(act,state$()); 
                   tasks.map((t) => t.fork(throwOr(action$), action$));
                   return s1;
                 }, action$);
  flyd.on( (s) => {
    console.log("<--" + JSON.stringify(s));
    snapshots.push(s);
  }, state$);

  state$(init);
  return state$;
}

 
///////////////////////////////////////////////////////////////////////////////
test('set-country action', (assert) => {
  
  assert.plan(2);

  const action$ = flyd.stream();
  let snapshots = [];
  start(action$, snapshots, app.init());
  
  action$(app.Action.SetCountry(Maybe('DE')));

  assert.equal(snapshots.length, 2, "one state change plus initial");
  assert.ok(snapshots[1].country.equals(Maybe('DE')), "set country to Just expected");

});

test('search action, success', (assert) => {
  
  assert.plan(2);

  const action$ = flyd.stream();
  let snapshots = [];
  const state$ = start(action$, snapshots, app.init());
  
  action$(app.Action.SetCountry(Maybe('US')));

  const searchAction = app.search.Action.Input(app.query(state$()), 
                                               Maybe('Philadelphia, PA'));
  action$(app.Action.Search(searchAction));

  setTimeout( () => {
      assert.equal(snapshots.length, 4, "three state changes plus initial");
      assert.ok(snapshots[3].search.menu.items.length > 0, "at least one search result displayed in menu");
    }, 2000);  

});

test('search action, failure (404 not found)', (assert) => {
  
  assert.plan(2);

  const action$ = flyd.stream();
  let snapshots = [];
  const state$ = start(action$, snapshots, app.init());
  
  action$(app.Action.SetCountry(Maybe('US')));

  const searchAction = app.search.Action.Input(app.query(state$()), 
                                               Maybe('Flooby, MA'));
  action$(app.Action.Search(searchAction));

  setTimeout( () => {
      assert.equal(snapshots.length, 4, "three state changes plus initial");
      assert.equal(snapshots[3].search.menu.items.length, 0, "no search results displayed in menu");
    }, 2000);  

});

test('search action, failure (no country set)', (assert) => {

  assert.plan(2);

  const action$ = flyd.stream();
  let snapshots = [];
  const state$ = start(action$, snapshots, app.init());
  
  const searchAction = app.search.Action.Input(app.query(state$()), 
                                               Maybe('Philadelphia, PA'));
  action$(app.Action.Search(searchAction));

  setTimeout( () => {
      assert.equal(snapshots.length, 3, "two state changes plus initial");
      assert.equal(snapshots[2].search.menu.items.length, 0, "no search results displayed in menu");
    }, 1000);  
 
});

test('search action, failure (place and state not parsed)', (assert) => {

  assert.plan(2);

  const action$ = flyd.stream();
  let snapshots = [];
  const state$ = start(action$, snapshots, app.init());
  
  action$(app.Action.SetCountry(Maybe('US')));

  const searchAction = app.search.Action.Input(app.query(state$()), 
                                               Maybe('Philadelphia PA'));
  action$(app.Action.Search(searchAction));

  setTimeout( () => {
      assert.equal(snapshots.length, 4, "three state changes plus initial");
      assert.equal(snapshots[3].search.menu.items.length, 0, "no search results displayed in menu");
    }, 1000);  
 
});

test('search action, failure (place blank)', (assert) => {

  assert.plan(2);

  const action$ = flyd.stream();
  let snapshots = [];
  const state$ = start(action$, snapshots, app.init());
  
  action$(app.Action.SetCountry(Maybe('US')));

  const searchAction = app.search.Action.Input(app.query(state$()), 
                                               Maybe(', PA'));
  action$(app.Action.Search(searchAction));

  setTimeout( () => {
      assert.equal(snapshots.length, 4, "three state changes plus initial");
      assert.equal(snapshots[3].search.menu.items.length, 0, "no search results displayed in menu");
    }, 1000);  
 
});

