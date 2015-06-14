/* jshint esnext: true */
const R = require('ramda')
const Type = require('union-type-js')
const h = require('snabbdom/h')
const forwardTo = require('flyd-forwardto')

const treis = require('treis')

module.exports = function(Component) {

  // Model
  const init = () => ({
    items: [Component.init(0), Component.init(1)],
  })

  // Actions
  const Action = Type({
    Add: [],
    Reverse: [],
    Modify: [Number, Component.Action],
  })

  // Update
  const update = Action.caseOn({ // action -> model -> model
    Add: (model) => R.evolve({items: R.append(Component.init(0))}, model),
    Reverse: R.evolve({items: R.reverse}),
    Modify: (idx, counterAction, model) => R.evolve({
      items: R.adjust(Component.update(counterAction), idx)
    }, model)
  })

  // View
  const view = R.curry((action$, model) =>
    h('div.list', [
      h('button', {on: {click: [action$, Action.Reverse()]}}, 'Reverse'),
      h('button', {on: {click: [action$, Action.Add()]}}, 'Add'),
      h('ul', R.mapIndexed((item, idx) =>
        h('li', [Component.view(forwardTo(action$, Action.Modify(idx)), item)]), model.items))
    ]))

  return {init, Action, update, view}
};

