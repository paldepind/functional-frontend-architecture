import test from 'tape'
import flyd from 'flyd'
import Future from 'ramda-fantasy/src/Future'
import prop from 'ramda/src/prop'
import map from 'ramda/src/map'

import menu from './menu'
import autocomplete from './autocomplete'

const identity = (x) => x
const T = (_) => true


const throwOr = (fn) => {
  return (x) => {
    if (x instanceof Error) throw x; 
    return fn(x);
  }
}

const mockTaskCalls = (rets,parse=identity,guard=T) => {
  let i = -1;
  return (str,model) => {
    return map(parse, new Future( (rej, res) => {
      i = i+1;
      if (i > rets.length-1){ 
        rej(new Error('Too many calls')); 
      } else { 
        if (guard(str,model)) {
          res(rets[i]) ;
        } else {
          rej(rets[i]) ;
        }
      }
    }));
  }
}

const start = (action$, snapshots, subj, init) => {
  const state$ = flyd.map( (act) => {
                   const [s1,tasks] = subj.update(act,state$()); 
                   tasks.map((t) => t.fork(throwOr(action$), action$));
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

  action$( subj.Action.Input(query, 'hello') );
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
  const query = mockTaskCalls([["high"]],identity,guard);
  
  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, 'hi') );

  assert.equal(snapshots.length, 3, "three state changes (including initial)");
  assert.equal(snapshots[1].value, 'hi', "value changed to input value");
  assert.equal(snapshots[1].menu.items.length, 0, "menu not populated");
  assert.equal(snapshots[2].menu.items.length, 0, "menu not populated after query");

  assert.end();
});

test('autocomplete input action, with guard passing', (assert) => {

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu ) ;
  const guard = (str) => str.length >= 3
  const query = mockTaskCalls([["hum","humor","human"]],identity,guard);

  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, 'hum') );

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

  const calls = [[],
                 [],
                 ["hum","humor","human","humid"],
                 ["humor"],
                 [],
                 ["home"],
                 ["home","hominid"],
                 []
                ];

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu );
  const guard = (str) => str.length >= 3
  const query = mockTaskCalls(calls,identity,guard);

  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, 'h') );
  action$( subj.Action.Input(query, 'hu') );
  action$( subj.Action.Input(query, 'hum') );
  action$( subj.Action.Input(query, 'humo') );
  action$( subj.Action.Input(query, 'hume') );
  action$( subj.Action.Input(query, 'home') );
  action$( subj.Action.Input(query, 'hom') );
  action$( subj.Action.Input(query, '') );
  
  const exp = 1 + (2 + 2 + 2 + 2 + 2 + 2 + 2 + 2) ;
  assert.equal(snapshots.length, exp, 
               "" + exp + " state changes (including initial)");

  for (let i=0;i<calls.length;++i){
    let c = calls[i];
    let idx = (2*(i+1));
    if (c.length === 0){
      assert.equal( snapshots[idx].menu.items.length, 0,
                    " at " + idx + ": menu items empty");
    } else {
      assert.deepEqual( snapshots[idx].menu.items, c,
                        " at " + idx + ": menu items populated");
    }
  }

  assert.end();
});


test('autocomplete input action, with parsing', (assert) => {

  const calls = [[{value: "hum"},{value: "humor"},{value: "human"}]];

  const subjMenu = menu({view: identity, init: identity}, identity);
  const subj = autocomplete( subjMenu );
  const parse = map(prop('value'));
  const query = mockTaskCalls(calls,parse,T) ;
  
  const action$ = flyd.stream();
  const snapshots = [];
  start(action$, snapshots, subj, subj.init() );

  action$( subj.Action.Input(query, 'hum') );

  assert.equal(snapshots.length, 3, 
               "three state changes (including initial)");

  assert.equal(snapshots[2].value, 'hum', 
               " at 2: value equals input value");
  assert.deepEqual(snapshots[2].menu.items, parse(calls[0]), 
               " at 2: menu items populated");

  assert.end();
});

