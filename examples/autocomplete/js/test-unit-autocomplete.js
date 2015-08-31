import test from 'tape'
import flyd from 'flyd'
import Future from 'ramda-fantasy/src/Future'
import prop from 'ramda/src/prop'
import map from 'ramda/src/map'

import menu from './menu'
import autocomplete from './autocomplete'

const identity = (x) => x
const T = (_) => true

const mockTaskCalls = (rets,parse=identity) => {
  let i = -1;
  return (_) => {
    return map(parse, new Future( (rej, res) => {
      i = i+1;
      if (i > rets.length-1){ rej(new Error('Too many calls')); } else { res(rets[i]) }
    }));
  }
}

const start = (action$, snapshots, subj, init) => {
  const state$ = flyd.map( (act) => {
                   const [s1,tasks] = subj.update(act,state$()); 
                   tasks.map((t) => t.fork((e) => { throw e; }, action$));
                   return s1;
                 }, action$);
  flyd.on( (s) => {
    console.log(s);
    snapshots.push(s);
  }, state$);

  state$(init);
}

test('autocomplete hide-menu action', (assert) => {

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu );
  const query = mockTaskCalls([["world"]]);

  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, T, 'hello') );
  action$( subj.Action.HideMenu() );

  assert.equal(snapshots.length, 4, "four state changes (including initial)");
  assert.equal(snapshots[1].menuVisible, true, " at 1: menu visible");
  assert.equal(snapshots[3].menuVisible, false, " at 3: menu not visible");

  assert.end();
});

test('autocomplete input action, with guard failing', (assert) => {

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu );
  const guard = (str) => str.length >= 3
  const query = mockTaskCalls([]);
  
  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, guard, 'hi') );

  assert.equal(snapshots.length, 2, "two state changes (including initial)");
  assert.equal(snapshots[1].value, 'hi', "value changed to input value");

  assert.end();
});

test('autocomplete input action, with guard passing', (assert) => {

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu ) ;
  const guard = (str) => str.length >= 3
  const query = mockTaskCalls([["hum","humor","human"]]);

  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, guard, 'hum') );

  assert.equal(snapshots.length, 3, 
               "three state changes (including initial)");
  
  assert.equal(snapshots[1].value, 'hum', 
               " at 1: value changed to input value");
  assert.equal(snapshots[1].menu.items.length, 0, 
               " at 1: menu not populated");

  assert.equal(snapshots[2].value, 'hum', 
               " at 2: value equals input value");
  assert.equal(snapshots[2].menuVisible, true,
               " at 2: menu visible");
  assert.deepEqual(snapshots[2].menu.items, ["hum","humor","human"], 
               " at 2: menu items populated");

  assert.end();
  
});

test('autocomplete input action, multiple transitions', (assert) => {

  const calls = [["hum","humor","human","humid"],
                 ["humor"],
                 [],
                 ["home"],
                 ["home","hominid"]
                ];

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu );
  const guard = (str) => str.length >= 3
  const query = mockTaskCalls(calls);

  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, guard, 'h') );
  action$( subj.Action.Input(query, guard, 'hu') );
  action$( subj.Action.Input(query, guard, 'hum') );
  action$( subj.Action.Input(query, guard, 'humo') );
  action$( subj.Action.Input(query, guard, 'hume') );
  action$( subj.Action.Input(query, guard, 'home') );
  action$( subj.Action.Input(query, guard, 'hom') );
  action$( subj.Action.Input(query, guard, '') );
  
  const exp = 1 + (1 + 1 + 2 + 2 + 2 + 2 + 2 + 2) ;
  assert.equal(snapshots.length, exp, 
               "" + exp + " state changes (including initial)");

  assert.deepEqual( snapshots[1+1+2].menu.items, calls[0],
                    " at " + (1+1+2) + ": menu items 0 populated");
  assert.deepEqual( snapshots[1+1+2+2].menu.items, calls[1],
                    " at " + (1+1+2+2) + ": menu items 1 populated");
  assert.equal( snapshots[1+1+2+2+2].menu.items.length, 0,
                    " at " + (1+1+2+2+2) + ": menu items empty");
  assert.deepEqual( snapshots[1+1+2+2+2+2].menu.items, calls[3],
                    " at " + (1+1+2+2+2+2) + ": menu items 3 populated");
  assert.deepEqual( snapshots[1+1+2+2+2+2+2].menu.items, calls[4],
                    " at " + (1+1+2+2+2+2+2) + ": menu items 4 populated");
  assert.equal( snapshots[1+1+2+2+2+2+2+2].menu.items.length, 0,
                    " at " + (1+1+2+2+2+2+2+2) + ": menu items empty");

  assert.end();
});


test('autocomplete input action, with parsing', (assert) => {

  const calls = [[{value: "hum"},{value: "humor"},{value: "human"}]];

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu );
  const parse = map(prop('value'));
  const query = mockTaskCalls(calls,parse) ;
  const guard = T;
  
  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, guard, 'hum') );

  assert.equal(snapshots.length, 3, 
               "three state changes (including initial)");

  assert.equal(snapshots[2].value, 'hum', 
               " at 2: value equals input value");
  assert.deepEqual(snapshots[2].menu.items, parse(calls[0]), 
               " at 2: menu items populated");

  assert.end();
});

