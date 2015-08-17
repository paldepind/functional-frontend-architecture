/* jshint esnext: true */
const R = require('ramda');
const Type = require('union-type');
const h = require('snabbdom/h');


// Model

const init = (n) => n;


// Update

const Action = Type({Increment: [], Decrement: []});

const update = Action.caseOn({
  Increment: R.add(1),
  Decrement: R.add(-1),
})


// View

const view = R.curry((context, model) =>
  h('div.counter', {style: {}}, [
    h('button', {on: {click: [context.actions, Action.Decrement()]}}, '–'), ' ',
    h('span.nr', model), ' ',
    h('button', {on: {click: [context.actions, Action.Increment()]}}, '+'), ' ',
    h('button', {on: {click: [context.remove]}}, 'X'),
  ]));


module.exports = {init, Action, update, view};
