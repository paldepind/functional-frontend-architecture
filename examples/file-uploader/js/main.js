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
const uploader = require('./uploader');

let state = app.init(), asyncActions, vnode

const render = () => {
  vnode = patch(vnode, app.view({action$: update, url: '/upload'}, state));
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

