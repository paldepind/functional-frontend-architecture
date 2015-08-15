/* jshint esnext: true */
const R = require('ramda');
const Type = require('union-type');
const h = require('snabbdom/h');


// Model
const init = (n) => n;

// Update
const Action = Type({Increment: [], Decrement: []});

const update = Action.caseOn({
    Increment: R.inc,
    Decrement: R.dec,
  });

// View
const view = R.curry((actions, model) =>
  h('div', {style: countStyle}, [
    h('button', {on: {click: [actions, Action.Decrement()]}}, '–'),
    h('div', {style: countStyle}, model),
    h('button', {on: {click: [actions, Action.Increment()]}}, '+'),
  ]));

const viewWithRemoveButton = R.curry((context, model) =>
  h('div', {style: countStyle}, [
    h('button', {on: {click: [context.actions, Action.Decrement()]}}, '–'), ' ',
    h('span', {style: countStyle}, model), ' ',
    h('button', {on: {click: [context.actions, Action.Increment()]}}, '+'), ' ',
    h('button', {on: {click: [context.remove]}}, 'X'),
  ]));

const countStyle = {fontSize:   '20px',
                    fontFamily: 'monospace',
                    width:      '50px',
                    textAlign:  'center'};

module.exports = {init, Action, update, view, viewWithRemoveButton};
