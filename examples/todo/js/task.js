/* jshint esnext: true */
const R = require('ramda');
const Type = require('union-type');
const h = require('snabbdom/h');

const targetValue = require('../../../helpers/targetvalue');
const ifEnter = require('../../../helpers/ifenter');

// Model

const init = (id, title) => ({
  title,
  done: false,
  editing: false,
  id: id,
})

// Actions

const Action = Type({
  ToggleDone: [],
  SetDone: [],
  UnsetDone: [],
  ToggleEditing: [],
  Remove: [],
  ChangeTitle: [String],
})

// Update

const update = Action.caseOn({ // action -> model -> model
  ToggleDone: R.evolve({done: R.not}),
  SetDone: R.evolve({done: R.T}),
  UnsetDone: R.evolve({done: R.F}),
  ToggleEditing: R.evolve({editing: R.not}),
  ChangeTitle: R.assoc('title'),
})

// View

function focus(oldVnode, vnode) {
  if (oldVnode.data.class.editing === false &&
      vnode.data.class.editing === true) {
    vnode.elm.querySelector('input.edit').focus();
  }
}

const blurTarget = R.curry((_, ev) => {
  ev.target.blur()
})

const view = R.curry((context, model) =>
  h('li', {
    class: {completed: model.done && !model.editing,
            editing: model.editing},
    hook: {update: focus},
    key: model.id,
  }, [
    h('div.view', [
      h('input.toggle', {
        props: {checked: model.done, type: 'checkbox'},
        on: {click: [context.action$, Action.ToggleDone()]},
      }),
      h('label', {
        on: {dblclick: [context.action$, Action.ToggleEditing()]}
      }, model.title),
      h('button.destroy', {on: {click: [context.remove$, undefined]}}),
    ]),
    h('input.edit', {
      props: {value: model.title},
      on: {
        blur: [context.action$, Action.ToggleEditing()],
        keydown: ifEnter(blurTarget, undefined),
        input: R.compose(context.action$, Action.ChangeTitle, targetValue),
      },
    }),
  ]))

module.exports = {init, Action, update, view}
