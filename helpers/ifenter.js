var R = require('ramda');

module.exports = R.curry(function(fn, val, ev) {
  if (ev.keyCode === 13) return fn(val);
});
