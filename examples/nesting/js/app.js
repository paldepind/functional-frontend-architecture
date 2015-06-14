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
const List = require('./list')
const Counter = require('../../counters/4/counter')
const Switch = require('./switch')
const CounterList = List(Counter);
const SwitchList = List(Switch);

const Tabs = [CounterList, SwitchList, CounterList];

// Model

const init = () => ({
  tabs: [CounterList.init(), CounterList.init(), CounterList.init()],
  activeTab: 0,
});

// Actions

const Action = Type({
  TabAction: [Number, R.T],
  ChangeTab: [Number],
});

// Update

// action -> model -> newModel
const update = Action.caseOn({
  TabAction: (idx, tabAction, model) => R.evolve({
    tabs: R.adjust(Tabs[idx].update(tabAction), idx)
  }, model),
  ChangeTab: R.assoc('activeTab'),
})

// View

const view = R.curry((action$, model) => {
  const idx = model.activeTab,
        tab = model.tabs[model.activeTab]
  return h('div', [
    h('h1', 'Counters'),
    h('ul.tabs', [
      h('li', {on: {click: [action$, Action.ChangeTab(0)]},
               class: {active: idx === 0}}, 'Counters'),
      h('li', {on: {click: [action$, Action.ChangeTab(1)]},
               class: {active: idx === 1}}, 'Switches'),
      h('li', {on: {click: [action$, Action.ChangeTab(2)]},
               class: {active: idx === 2}}, 'Counters'), 
    ]),
    Tabs[idx].view(forwardTo(action$, Action.TabAction(idx)), tab),
  ])
})

// Streams
const action$ = flyd.stream();
const model$ = flyd.scan(R.flip(update), init(), action$)
const vnode$ = flyd.map(view(action$), model$)

flyd.map((model) => console.log(model), model$); // Uncomment to log state on every update

window.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('#container')
  flyd.scan(patch, container, vnode$)
})
