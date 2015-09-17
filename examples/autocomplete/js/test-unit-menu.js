
import test from 'tape'
import menu from './menu'

import prop from 'ramda/src/prop'
import map from 'ramda/src/map'
import Maybe from 'ramda-fantasy/src/Maybe'

const identity = (x) => x

const confirmSelected = (assert) => {
  return (inits, exps, subj) => {
    let actual = subj.init(inits);
    for (var i=0;i<exps.length;++i){
      actual = subj.update( subj.Action.Select(Maybe(i)), actual);
      console.log(JSON.stringify(actual));
      map((act) => { assert.equal(act, i, "selected index updated: " + i); }, 
          actual.selected);
      map((act) => { assert.equal(act, exps[i], "selected value updated"); },
          actual.selectedValue);
    }
  }
}

const confirmNothingSelectedAct = (assert) => {
  return (act, inits, subj) => {
    let actual = subj.init(inits);
    actual = subj.update( act(), actual);
    console.log(JSON.stringify(actual));
    assert.ok(actual.selected.isNothing(), 'selected index is Nothing');
    assert.ok(actual.selectedValue.isNothing(), 'selected value is Nothing');
  }
}

const confirmSelectedAct = (assert) => {
  return (act, inits, exps, subj) => {
    let actual = subj.init(inits);
    for (var i=0;i<exps.length;++i){
      actual = subj.update( act(), actual);
      console.log(JSON.stringify(actual));
      map((act) => { assert.equal(act, exps[i], "selected index updated: " + exps[i]); },
        actual.selected);
    }
  }
}

test('menu select action, simple menu item component', (assert) => {
  assert.plan(3 * 2);

  const subj = menu({view: identity, init: identity}, identity);

  confirmSelected(assert)(["one","two","three"],
                          ["one","two","three"], subj);

});

test('menu select action, complex menu item component', (assert) => {
  assert.plan(3 * 2);

  const subj = menu({init: (v) => { return {value: v} }, 
                     view: (o) => o.value + " little piggy"},
                    prop('value')
                   );

  confirmSelected(assert)(["one","two","three"],
                          ["one","two","three"], subj);

 
});

test('menu select-next action', (assert) => {
  assert.plan(10+2);

  const subj = menu({view: identity, init: identity}, identity);

  confirmSelectedAct(assert)(subj.Action.SelectNext, 
                             ["one","two","three","four","five"],
                             [0,1,2,3,4,0,1,2,3,4], 
                             subj);

  const emptySubj = menu({view: identity, init: identity}, identity);

  confirmNothingSelectedAct(assert)(emptySubj.Action.SelectNext, [], emptySubj);

});

test('menu select-prev action', (assert) => {
  assert.plan(10+2);

  const subj = menu({view: identity, init: identity}, identity);

  confirmSelectedAct(assert)(subj.Action.SelectPrev, 
                             ["one","two","three","four","five"],
                             [4,3,2,1,0,4,3,2,1,0], 
                             subj);

  const emptySubj = menu({view: identity, init: identity}, identity);

  confirmNothingSelectedAct(assert)(emptySubj.Action.SelectPrev, [], emptySubj);

});

test('menu refresh action', (assert) => {
  assert.plan(3);

  const subj = menu({view: identity, init: identity}, identity);
  
  let actual = subj.init([]);
  actual = subj.update(subj.Action.Refresh(["four","five"]), actual);

  assert.ok(actual.selected.isNothing(), "selected is Nothing after refresh");
  assert.ok(actual.selectedValue.isNothing(), "selectedValue is Nothing after refresh");
  assert.deepEqual(actual.items, ["four","five"], "items are changed after refresh");
 
});
