/* jshint esnext: true */
const R = require('ramda');
const h = require('snabbdom/h');
const attachTo = require('snabbdom/helpers/attachto');

// View

const view = R.curry((close$, vnodeArray) =>
  // `close$` is currently unused, but it would be needed if the modal included
  // default ways to close itself. Like handling escape, a close button, etc.
  attachTo(document.body, h('div.modal', {}, [
    h('div.modal-content', vnodeArray),
    h('div.modal-backdrop'),
  ])))

module.exports = {view}
