/* jshint esnext: true */
const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const forwardTo = require('flyd-forwardto');
const Type = require('union-type-js');
const h = require('snabbdom/h');

// Model

const init = (title) => ({
  title,
  done: false,
  editing: false,
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

const update = (model, action) => //!console.log(action) &&
  Action.case({
    ToggleDone: () => R.evolve({done: R.not}, model),
    SetDone: () => R.evolve({done: R.T}, model),
    UnsetDone: () => R.evolve({done: R.F}, model),
    ToggleEditing: () => R.evolve({editing: R.not}, model),
    ChangeTitle: (title) => R.evolve({title: R.always(title)}, model),
  }, action)

// View

function targetValue(ev) {
  return ev.target.value
}

function focus(oldVnode, vnode) {
  if (oldVnode.data.class.editing === false &&
      vnode.data.class.editing === true) {
    vnode.elm.querySelector('input.edit').focus();
  }
}

const view = R.curry((context, model) =>
  h('li', {
    class: {completed: model.done && !model.editing,
            editing: model.editing},
    hook: {update: focus},
  }, [
    h('div.view', [
      h('input.toggle', {
        props: {checked: model.done, type: 'checkbox'},
        on: {click: [context.action$, Action.ToggleDone()]},
      }),
      h('label', {
        on: {dblclick: [context.action$, Action.ToggleEditing()]}
      }, model.title),
      h('button.destroy', {on: {click: [context.remove$]}}),
    ]),
    h('input.edit', {
      props: {value: model.title},
      on: {
        blur: [context.action$, Action.ToggleEditing()],
        input: R.compose(context.action$, Action.ChangeTitle, targetValue),
      },
    }),
  ]))

module.exports = {init, Action, update, view}
