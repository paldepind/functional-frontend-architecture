const R = require('ramda')
const Type = require('union-type')
const patch = require('snabbdom').init([
  require('snabbdom/modules/class').default,
  require('snabbdom/modules/props').default,
  require('snabbdom/modules/eventlisteners').default,
  require('snabbdom/modules/style').default,
]);
const h = require('snabbdom/h').default
const Future = require('ramda-fantasy/src/Future')


let component = require('./app.js')
let state = component.init(), asyncActions
let vnode

const render = () => vnode = patch(vnode, component.view(update, state))

const update = (action) => {
  [state, asyncActions] = component.update(action, state)
  R.map((a) => a.fork((err) => { throw err }, update), asyncActions)
  console.log(state)
  render()
}

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  vnode = document.getElementById('container')
  render()
})
