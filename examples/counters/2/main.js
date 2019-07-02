/* jshint esnext: true */
const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const forwardTo = require('flyd-forwardto');
const Type = require('union-type');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class').default,
  require('snabbdom/modules/props').default,
  require('snabbdom/modules/eventlisteners').default,
  require('snabbdom/modules/style').default,
]);
const h = require('snabbdom/h').default;


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
  Action.case({
    Reset: () => init(0, 0),
    Top: (act) => R.evolve({topCounter: counter.update(R.__, act)}, model),
    Bottom: (act) => R.evolve({bottomCounter: counter.update(R.__, act)}, model),
  }, action);

// View
const view = R.curry((actions$, model) =>
  h('div', [
    counter.view(forwardTo(actions$, Action.Top), model.topCounter),
    counter.view(forwardTo(actions$, Action.Bottom), model.bottomCounter),
    h('button', {on: {click: [actions$, Action.Reset()]}}, 'RESET'),
  ]));

// Streams
const actions$ = flyd.stream();
const model$ = flyd.scan(update, init(0, 0), actions$);
const vnode$ = flyd.map(view(actions$), model$);

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  flyd.scan(patch, container, vnode$);
});
