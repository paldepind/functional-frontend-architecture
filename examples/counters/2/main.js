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
  topCounter: counter.init(top),
  bottomCounter: counter.init(bottom)
});

// Update
const Action = Type({
  Reset: [],
  Top: [counter.Action],
  Bottom: [counter.Action],
});

const update = (model, action) =>
  Type.case({
    Reset: () => init(0, 0),
    Top: (act) => R.evolve({topCounter: counter.update(R.__, act)}, model),
    Bottom: (act) => R.evolve({bottomCounter: counter.update(R.__, act)}, model),
  }, action);

// View
const view = R.curry((actions$, model) => 
  h('div', [
    counter.view(forwardTo(actions$, Action.Top), model.topCounter),
    counter.view(forwardTo(actions$, Action.Bottom), model.bottomCounter),
    h('button', {onclick: [actions$, Action.Reset()]}, 'RESET'),
  ]));

// Streams
const actions$ = flyd.stream();
const model$ = flyd.scan(update, init(0, 0), actions$);
const vnode$ = flyd.map(view(actions$), model$);

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  flyd.scan(snabbdom.patch, snabbdom.emptyNodeAt(container), vnode$);
});
