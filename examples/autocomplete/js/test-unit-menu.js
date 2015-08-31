
import test from 'tape'
import menu from './menu'

import prop from 'ramda/src/prop'
const identity = (x) => x

const confirmSelected = (assert) => {
  return (inits, exps, subj) => {
    let actual = subj.init(inits);
    for (var i=0;i<exps.length;++i){
      actual = subj.update( subj.Action.Select(i), actual);
      console.log(JSON.stringify(actual));
      assert.equal(actual.selected, i, "selected index updated: " + i);
      assert.equal(actual.selectedValue, exps[i], "selected value updated");
    }
  }
}

const confirmSelectedAct = (assert) => {
  return (act, inits, exps, subj) => {
    let actual = subj.init(inits);
    for (var i=0;i<exps.length;++i){
      actual = subj.update( act(), actual);
      console.log(JSON.stringify(actual));
      assert.equal(actual.selected, exps[i], "selected index updated: " + exps[i]);
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
  assert.plan(11);

  const subj = menu({view: identity, init: identity}, identity);

  confirmSelectedAct(assert)(subj.Action.SelectNext, 
                             ["one","two","three","four","five"],
                             [0,1,2,3,4,0,1,2,3,4], 
                             subj);

  const emptySubj = menu({view: identity, init: identity}, identity);

  confirmSelectedAct(assert)(emptySubj.Action.SelectNext, [], [null], emptySubj);

});

test('menu select-prev action', (assert) => {
  assert.plan(11);

  const subj = menu({view: identity, init: identity}, identity);

  confirmSelectedAct(assert)(subj.Action.SelectPrev, 
                             ["one","two","three","four","five"],
                             [4,3,2,1,0,4,3,2,1,0], 
                             subj);

  const emptySubj = menu({view: identity, init: identity}, identity);

  confirmSelectedAct(assert)(emptySubj.Action.SelectPrev, [], [null], emptySubj);

});

test('menu refresh action', (assert) => {
  assert.plan(3);

  const subj = menu({view: identity, init: identity}, identity);
  
  let actual = subj.init([]);
  actual = subj.update(subj.Action.Refresh(["four","five"]), actual);

  assert.equal(actual.selected, null, "selected is null after refresh");
  assert.equal(actual.selectedValue, null, "selectedValue is null after refresh");
  assert.deepEqual(actual.items, ["four","five"], "items are changed after refresh");
 
});
