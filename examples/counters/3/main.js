/* jshint esnext: true */
const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const forwardTo = require('flyd-forwardto');
const snabbdom = require('snabbdom');
const h = snabbdom.h;
const Type = require('union-type-js');

const counter = require('./counter.js');


// Model
const init = (top, bottom) => ({
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
  Type.case({
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
  console.log(c);
  const [id, model] = c;
  return counter.view(forwardTo(actions$, Action.Modify(id)), model);
});

const view = R.curry(function (actions$, model) {
  console.log('view');
  console.log(model.counters);
  const counters = R.map(viewCounter(actions$), model.counters);
  return h('div', 
    R.concat([h('button.rm', {onclick: [actions$, Action.Remove()]}, 'Remove'),
              h('button.add', {onclick: [actions$, Action.Insert()]}, 'Add')], counters)
  );
});

// Streams
const actions$ = flyd.stream();
const model$ = flyd.scan(update, init(0, 0), actions$);
const vnode$ = flyd.map(view(actions$), model$);

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update
 
window.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('container');
  flyd.scan(snabbdom.patch, snabbdom.emptyNodeAt(container), vnode$);
});
