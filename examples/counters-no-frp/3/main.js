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
const init = () => ({
  counters: [],
  nextId: 0,
});

// Update
const Action = Type({
  Insert: [],
  Remove: [],
  Modify: [Number, counter.Action],
});

// View

const update = (action, model) =>
  Action.case({
    Insert: () => R.evolve({nextId: R.add(1),
                           counters: R.append([model.nextId, counter.init(0)])}, model),
    Remove: () => R.evolve({counters: R.tail}, model),
    Modify: (id, counterAction) =>
      R.evolve({counters: R.map((c) => {
                  const [counterId, counterModel] = c;
                  return counterId === id ? [counterId, counter.update(counterAction, counterModel)] : c;
               })}, model)
  }, action);

// View

const viewCounter = R.curry((actions, c) => {
  const [id, model] = c;
  return counter.view(R.compose(actions, Action.Modify(id)), model);
});

const view = R.curry(function (actions, model) {
  const counters = R.map(viewCounter(actions), model.counters);
  return h('div',
    R.concat([h('button.rm', {on: {click: [actions, Action.Remove()]}}, 'Remove'),
              h('button.add', {on: {click: [actions, Action.Insert()]}}, 'Add')], counters)
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
