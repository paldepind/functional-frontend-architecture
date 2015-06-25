/* jshint esnext: true */
const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const forwardTo = require('flyd-forwardto');
const Type = require('union-type');
const patch = require('snabbdom/snabbdom.js').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
]);
const h = require('snabbdom/h')

const Modal = require('./modal')

// Model

const init = () => ({
  modalOpen: false,
});

// Actions

const Action = Type({
  OpenModal: [],
  CloseModal: [],
});

// Update

// action -> model -> newModel
const update = Action.caseOn({
  OpenModal: R.assoc('modalOpen', true),
  CloseModal: R.assoc('modalOpen', false),
})

// View

const view = R.curry((action$, model) => {
  return h('div', [
    'Press the button below to open the modal', h('br'),
    h('button', {on: {click: [action$, Action.OpenModal()]}}, 'Open modal'),
    model.modalOpen ? Modal.view(forwardTo(action$, Action.CloseModal), [
                        'This is inside the modal', h('br'),
                        'The modal is attached to the body', h('br'),
                         h('button', {on: {click: [action$, Action.CloseModal()]}}, 'Close'),
                      ])
                    : h('span')
  ])
})

// Streams
const action$ = flyd.stream();
const model$ = flyd.scan(R.flip(update), init(), action$)
const vnode$ = flyd.map(view(action$), model$)

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

window.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('#container')
  flyd.scan(patch, container, vnode$)
})
