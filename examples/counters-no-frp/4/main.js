/* jshint esnext: true */
const R = require('ramda');
const Type = require('union-type');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
  require('snabbdom/modules/style'),
]);
const h = require('snabbdom/h');

const counter = require('./counter.js');


// Model

const init = (top, bottom) => ({
  counters: [],
  nextId: 0,
});

// Update

const Action = Type({
  Insert: [],
  Remove: [Number],
  Modify: [Number, counter.Action],
});

const update = Action.caseOn({
    Insert: (model) =>
      R.evolve({nextId: R.inc, counters: R.append([model.nextId, counter.init(0)])}, model),
    Remove: (id, model) => R.evolve({counters: R.reject((c) => c[0] === id)}, model),
    Modify: (id, counterAction, model) =>
      R.evolve({counters: R.map((c) => {
                  const [counterId, counterModel] = c;
                  return counterId === id ? [counterId, counter.update(counterAction, counterModel)] : c;
               })}, model)
  });

// View

const viewCounter = R.curry((actions, c) => {
  const [id, model] = c;
  console.log('viewCounter', id, model);
  return counter.viewWithRemoveButton({
    actions: R.compose(actions, Action.Modify(id)),
    remove: R.compose(actions, R.always(Action.Remove(id))),
  }, model);
});

const view = R.curry((actions$, model) => {
  const counters = R.map(viewCounter(actions$), model.counters);
  return h('div',
    R.prepend(h('button.add', {on: {click: [actions$, Action.Insert()]}}, 'Add'),
              counters)
  );
});

const main = (oldState, oldVnode, view, update) => {
  const newVnode = view((action) => {
    const newState = update(action, oldState);
    main(newState, newVnode, view, update);
  }, oldState);
  patch(oldVnode, newVnode);
};

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  main(init(0, 0), container, view, update);
});
