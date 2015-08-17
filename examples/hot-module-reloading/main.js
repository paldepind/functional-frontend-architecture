const R = require('ramda')
const Type = require('union-type')
const patch = require('snabbdom').init([
  require('snabbdom/modules/class'),
  require('snabbdom/modules/props'),
  require('snabbdom/modules/eventlisteners'),
  require('snabbdom/modules/style'),
]);
const h = require('snabbdom/h')

require('./style.css')


let component = require('./counters.js')
let state = component.init()
let vnode

const render = () => vnode = patch(vnode, component.view(update, state))

// If hot module replacement is enabled
if (module.hot) {
  // We accept updates to the top component
  module.hot.accept('./counters.js', (comp) => {
    // Mutate the variable holding our component
    component = require('./counters.js')
    // Render view in the case that any view functions has changed
    render()
  })
}

const update = (action) => {
  state = component.update(action, state)
  render()
}

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  vnode = document.getElementById('container')
  render()
})
