/* jshint esnext: true */
const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const forwardTo = require('flyd-forwardto');
const Type = require('union-type');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
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

const update = (model, action) =>
  Action.case({
    Insert: () => R.evolve({nextId: R.add(1),
                           counters: R.append([model.nextId, counter.init(0)])}, model),
    Remove: () => R.evolve({counters: R.tail}, model),
    Modify: (id, counterAction) =>
      R.evolve({counters: R.map((c) => {
                  const [counterId, counterModel] = c;
                  return counterId === id ? [counterId, counter.update(counterModel, counterAction)] : c;
               })}, model)
  }, action);

// View

const viewCounter = R.curry((actions$, c) => {
  const [id, model] = c;
  return counter.view(forwardTo(actions$, Action.Modify(id)), model);
});

const view = R.curry(function (actions$, model) {
  const counters = R.map(viewCounter(actions$), model.counters);
  return h('div',
    R.concat([h('button.rm', {on: {click: [actions$, Action.Remove()]}}, 'Remove'),
              h('button.add', {on: {click: [actions$, Action.Insert()]}}, 'Add')], counters)
  );
});

// Streams
const actions$ = flyd.stream();
const model$ = flyd.scan(update, init(), actions$);
const vnode$ = flyd.map(view(actions$), model$);

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

window.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('container');
  flyd.scan(patch, container, vnode$);
});
