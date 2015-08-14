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


// Update
const Action = Type({Increment: [], Decrement: []});

const update = (model, action) => Action.case({
    Increment: () => model + 1,
    Decrement: () => model - 1,
  }, action);

// View
const view = R.curry((actions$, model) =>
  h('div', {style: countStyle}, [
    h('button', {on: {click: [actions$, Action.Decrement()]}}, '–'),
    h('div', {style: countStyle}, model),
    h('button', {on: {click: [actions$, Action.Increment()]}}, '+'),
  ]));

const countStyle = {
  fontSize: '20px',
  fontFamily: 'monospace',
  width: '50px',
  textAlign: 'center',
};

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
  main(0, container, {view, update});
});
