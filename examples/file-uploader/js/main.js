/* globals: document, window */

const map = require('ramda/src/map');
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/style'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/attributes'),
  require('snabbdom/modules/eventlisteners')
]);

const app = require('./app');

let state = app.init(), asyncActions, vnode

const render = () => {
  vnode = patch(vnode, app.view({action$: update}, state));
};

const update = (action) => {
  [state, asyncActions] = app.update(action, state);
  map((a) => a.fork((err) => {throw err}, update), asyncActions);
  console.log(state);
  render();
};

window.addEventListener('DOMContentLoaded', () => {
  vnode = document.getElementById('container');
  render();
});

