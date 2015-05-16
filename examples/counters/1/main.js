/* jshint esnext: true */

const R = require('ramda');
const Type = require('union-type-js');
const flyd = require('flyd');
const stream = flyd.stream;
const snabbdom = require('snabbdom');
const h = snabbdom.h;


// Update
const Action = Type({Increment: [], Decrement: []});

const update = (model, action) =>
  Type.case({
    Increment: () => model + 1,
    Decrement: () => model - 1,
  }, action);

// View
const view = R.curry((actions$, model) =>
  h('div', {style: countStyle}, [
    h('button', {onclick: [actions$, Action.Decrement()]}, '–'),
    h('div', {style: countStyle}, model),
    h('button', {onclick: [actions$, Action.Increment()]}, '+'),
  ]));

const countStyle = {fontSize:   '20px',
                    fontFamily: 'monospace',
                    width:      '50px',
                    textAlign:  'center'};

// Streams
const actions$ = stream(); // All modifications to the state originate here
const model$ = flyd.scan(update, 0, actions$); // Contains the entire state of the application
const vnode$ = flyd.map(view(actions$), model$); // Stream of virtual nodes to render

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  flyd.scan(snabbdom.patch, snabbdom.emptyNodeAt(container), vnode$);
});
