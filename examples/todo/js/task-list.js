/* jshint esnext: true */
const R = require('ramda');
const flyd = require('flyd');
const stream = flyd.stream;
const forwardTo = require('flyd-forwardto');
const Type = require('union-type-js');
const Router = require('../../../router');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
]);
const treis = require('treis');
const h = require('snabbdom/h')

const targetValue = require('../../../helpers/targetvalue');
const ifEnter = require('../../../helpers/ifenter');

const Todo = require('./task')

// Model

const init = () => ({
  todos: [],
  newTitle: '',
  view: 'all',
  nextId: 0,
});

// Actions

const Action = Type({
  ChangeNewTitle: [String],
  Create: [],
  Remove: [Object],
  Modify: [Object, Todo.Action],
  ToggleAll: [],
  ClearDone: [],
  ChangePage: [R.T],
});

// Update

// action -> model -> newModel
const update = Action.caseOn({
  ChangeNewTitle: R.assoc('newTitle'),
  Create: (model) => R.evolve({todos: R.append(Todo.init(model.nextId, model.newTitle)),
                               nextId: R.inc,
                               newTitle: R.always('')}, model),
  Remove: (todo, model) => R.evolve({todos: R.reject(R.eq(todo))}, model),
  Modify: (todo, action, model) => {
    const idx = R.indexOf(todo, model.todos)
    return R.evolve({todos: R.adjust(Todo.update(action), idx)}, model)
  },
  ToggleAll: (model) => {
    const left = R.length(R.reject(R.prop('done'), model.todos)),
          todoAction = left === 0 ? Todo.Action.UnsetDone() : Todo.Action.SetDone();
    return R.evolve({todos: R.map(Todo.update(todoAction))}, model);
  },
  ClearDone: R.evolve({todos: R.reject(R.prop('done'))}),
  ChangePage: (action, model) => MyRouter.Action.case({
    ViewAll: () => R.evolve({view: R.always('all')}, model),
    ViewActive: () => R.evolve({view: R.always('active')}, model),
    ViewCompleted: () => R.evolve({view: R.always('complete')}, model),
  }, action)
})

// View

const viewTodo = R.curry((action$, todo) => {
  return Todo.view({
    action$: forwardTo(action$, Action.Modify(todo)),
    remove$: forwardTo(action$, R.always(Action.Remove(todo))),
  }, todo)
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
             keydown: ifEnter(action$, Action.Create())},
      }),
    ]),
    h('section.main', {
      style: {display: hasTodos ? 'block' : 'none'}
    }, [
      h('input.toggle-all', {props: {type: 'checkbox'}, on: {click: [action$, Action.ToggleAll()]}}),
      h('ul.todo-list', R.map(viewTodo(action$), filteredTodos)),
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

// Persistence
const restoreState = () => {
  const restored = JSON.parse(localStorage.getItem('state'));
  return restored === null ? init() : restored;
};

const saveState = (model) => {
  localStorage.setItem('state', JSON.stringify(model));
};

// Streams
const action$ = flyd.merge(MyRouter.stream, flyd.stream());
const model$ = flyd.scan(R.flip(update), restoreState(), action$)
const vnode$ = flyd.map(view(action$), model$)

flyd.map(saveState, model$);

// flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

window.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.todoapp')
  flyd.scan(patch, container, vnode$)
})
