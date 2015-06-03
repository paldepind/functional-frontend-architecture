/* jshint esnext: true */
const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const forwardTo = require('flyd-forwardto');
const Type = require('union-type-js');
const Router = require('../../../router.js');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
]);
const h = require('snabbdom/h')

const Todo = require('./task')

// Model

const init = () => ({
  todos: [],
  newTitle: '',
  view: 'all',
});

// Actions

const Action = Type({
  ChangeNewTitle: [String],
  Create: [],
  Remove: [Number],
  Modify: [Number, Todo.Action],
  ToggleAll: [],
  ClearDone: [],
  ChangePage: [R.T],
});

// Update

const update = (model, action) =>
  Action.case({
    ChangeNewTitle: (title) => R.evolve({newTitle: R.always(title)}, model),
    Create: () => R.evolve({todos: R.append(Todo.init(model.newTitle)),
                            newTitle: R.always('')}, model),
    Remove: (idx) => R.evolve({todos: R.remove(idx, 1)}, model),
    Modify: (idx, action) =>
      R.evolve({todos: R.adjust(Todo.update(R.__, action), idx)}, model),
    ToggleAll: () => {
      const left = R.length(R.reject(R.prop('done'), model.todos)),
            todoAction = left === 0 ? Todo.Action.UnsetDone() : Todo.Action.SetDone();
      return R.evolve({todos: R.map(Todo.update(R.__, todoAction))}, model);
    },
    ClearDone: () => R.evolve({todos: R.reject(R.prop('done'))}, model),
    ChangePage: (action) => MyRouter.Action.case({
      ViewAll: () => R.evolve({view: R.always('all')}, model),
      ViewActive: () => R.evolve({view: R.always('active')}, model),
      ViewCompleted: () => R.evolve({view: R.always('complete')}, model),
    }, action)
  }, action)

// View

const viewTodo = R.curry((action$, todo, idx) => {
  return Todo.view({
    action$: forwardTo(action$, Action.Modify(idx)),
    remove$: forwardTo(action$, R.always(Action.Remove(idx))),
  }, todo)
})

function targetValue(ev) {
  return ev.target.value
}

const whenEnter = R.curry((fn, val, ev) => {
  if (ev.keyCode === 13) fn(val)
})

const view = R.curry((action$, model) => {
  const hasTodos = model.todos.length > 0,
        left = R.length(R.reject(R.prop('done'), model.todos)),
        filteredTodos = model.view === 'all'    ? model.todos
                      : model.view === 'active' ? R.reject(R.prop('done'), model.todos)
                                                : R.filter(R.prop('done'), model.todos)
  return h('section.todoapp', [
    h('header.header', [
      h('h1', 'todos'),
      h('input.new-todo', {
        props: {placeholder: 'What needs to be done?',
                value: model.newTitle},
        on: {input: R.compose(action$, Action.ChangeNewTitle, targetValue),
             keydown: whenEnter(action$, Action.Create())},
      }),
    ]),
    h('section.main', {
      style: {display: hasTodos ? 'block' : 'none'}
    }, [
      h('input.toggle-all', {props: {type: 'checkbox'}, on: {click: [action$, Action.ToggleAll()]}}),
      h('ul.todo-list', R.mapIndexed(viewTodo(action$), filteredTodos)),
    ]),
    h('footer.footer', {
      style: {display: hasTodos ? 'block' : 'none'}
    }, [
      h('span.todo-count', [h('strong', left), ` item${left === 1 ? '' : 's'} left`]),
      h('ul.filters', [
        h('li', [h('a', {class: {selected: model.view === 'all'}, props: {href: '#/'}}, 'All')]),
        h('li', [h('a', {class: {selected: model.view === 'active'}, props: {href: '#/active'}}, 'Active')]),
        h('li', [h('a', {class: {selected: model.view === 'completed'}, props: {href: '#/completed'}}, 'Completed')]),
      ]),
      h('button.clear-completed', {on: {click: [action$, Action.ClearDone()]}}, 'Clear completed'),
    ])
  ])
})

// Router
const MyRouter = Router.init({
  history: false,
  constr: Action.ChangePage,
  routes: {
    '/': 'ViewAll',
    '/active': 'ViewActive',
    '/completed': 'ViewCompleted',
  },
});

// Streams
const action$ = flyd.merge(MyRouter.stream, flyd.stream());
const model$ = flyd.scan(update, init(0), action$)
const vnode$ = flyd.map(view(action$), model$)

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

window.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.todoapp')
  flyd.scan(patch, container, vnode$)
})
