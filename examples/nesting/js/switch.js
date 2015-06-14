/* jshint esnext: true */
const R = require('ramda');
const Type = require('union-type');
const h = require('snabbdom/h');


// Model
const init = (n) => n

// Update
const Action = Type({Toggle: []});

const update = Action.caseOn({
    Toggle: R.ifElse(R.eq(0), R.always(1), R.always(0)),
  })

// View
const view = R.curry((actions$, model) =>
  h('div.switch', {on: {click: [actions$, Action.Toggle()]}}, [
    h('span', {class: {active: model === 0}}, 'On'),
    h('span', {class: {active: model === 1}}, 'Off')
  ]))

const countStyle = {fontSize:   '20px',
                    fontFamily: 'monospace',
                    width:      '50px',
                    textAlign:  'center'}

module.exports = {init, Action, update, view}
