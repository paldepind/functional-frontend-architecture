require('whatwg-fetch');
const {always, flip, curry, map, take, addIndex, evolve, update: updateIndex, tap, pipeP} = require('ramda');
const flyd = require('flyd');
const Type = require('union-type')
const h = require('snabbdom/h');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
]);

const actions$ = flyd.stream();
const Action = Type({
  Remove: [Number],
  Loaded: [Array],
  Refresh: []
});

const fetchUsers = () => {
  const randomOffset = Math.floor(Math.random() * 500);
  return fetch('https://api.github.com/users?since=' + randomOffset, {
    // Set a personal token after getting rate-limited
    // headers: { 'Authorization': 'token YOUR_TOKEN' }
  })
  .then((res) => res.json())
};

const refreshUsers = pipeP(fetchUsers, Action.Loaded, actions$);
const mapIndexed = addIndex(map);
const sample = (xs) => xs[Math.floor(Math.random() * xs.length)];

const update = Action.caseOn({
  Loaded: (loaded, model) => ({loaded, suggested: take(3, loaded)}),
  Remove: (idx, model) => evolve({suggested: updateIndex(idx, sample(model.loaded))}, model),
  Refresh: tap(refreshUsers)
});

const init = always({
  suggested: [],
  loaded: []
});

const viewUser = curry((actions$, user, idx) => {
  return h('li', {}, [
    h('img', {props: {src: user.avatar_url}}),
    h('a.username', {props: {href: user.html_url}}, user.login),
    h('a.close', {props: {href: '#'}, on: {click: [actions$, Action.Remove(idx)]}}, 'x')
  ]);
})

const view = curry((actions$, model) => 
  h('div', {}, [
    h('div.header', {}, [
      h('h2', {}, 'Who to follow'),
      h('a#refresh', {
        props: {href: '#'},
        on: {click: [actions$, Action.Refresh()]}
      }, 'Refresh')
    ]),
    h('ul.suggestions', {}, mapIndexed(viewUser(actions$), model.suggested))
  ]));

const model$ = flyd.scan(flip(update), init(), actions$);
const vnode$ = flyd.map(view(actions$), model$);

// actions$.map((it) => console.log('action', it)) // Uncomment to log every action
// model$.map((it) => console.log('model', it)); // Uncomment to log state on every update

window.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('container');
  flyd.scan(patch, container, vnode$);
});

refreshUsers();
