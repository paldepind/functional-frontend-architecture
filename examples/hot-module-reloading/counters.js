const R = require('ramda')
const Type = require('union-type')
const h = require('snabbdom/h')

const counter = require('./counter.js')


// Model

const init = () => ({
  counters: [],
  nextId: 0,
})

// Update

const Action = Type({
  Insert: [],
  Remove: [Number],
  Modify: [Number, counter.Action],
})

const update = Action.caseOn({
    Insert: (model) =>
      R.evolve({nextId: R.inc, counters: R.append([model.nextId, counter.init(4)])}, model),
    Remove: (id, model) =>
      R.evolve({counters: R.reject((c) => c[0] === id)}, model),
    Modify: (id, counterAction, model) =>
      R.evolve({counters: R.map((c) => {
                  const [counterId, counterModel] = c
                  return counterId === id ? [counterId, counter.update(counterAction, counterModel)] : c
               })}, model)
  })

// View

const viewCounter = R.curry((actions, [id, model]) =>
  counter.view({
    actions: R.compose(actions, Action.Modify(id)),
    remove: R.compose(actions, R.always(Action.Remove(id))),
  }, model))

const addBtn = (actions) =>
  h('button.add', {
    on: {click: [actions, Action.Insert()]}
  }, 'Add counter')

const view = R.curry((actions, model) => {
  const counters = R.map(viewCounter(actions), model.counters)
  return h('div', R.prepend(addBtn(actions), counters))
})


module.exports = {init, Action, update, view}
