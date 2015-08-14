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
    counter.view(R.compose(actions$, Action.Top), model.topCounter),
    counter.view(R.compose(actions$, Action.Bottom), model.bottomCounter),
    h('button', {on: {click: [actions$, Action.Reset()]}}, 'RESET'),
  ]));

const main = (oldState, oldVnode, {view, update}) => {
  const newVnode = view((action) => {
    const newState = update(oldState, action);
    main(newState, newVnode, {view, update});
  }, oldState);
  patch(oldVnode, newVnode);
};

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  main(init(0, 0), container, {view, update});
});
