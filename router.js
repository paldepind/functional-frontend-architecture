var flyd = require('flyd');
var forwardTo = require('flyd-forwardto');
var ryter = require('ryter');
var Type = require('union-type-js');

function any() { return true; }

var Change = Type({Change: [any]});

function createFn(constr, str, fn) {
  return function() {
    str(constr(fn.apply(null, arguments)));
  };
}

function createType(routes) {
  var i, arr, n, url, typeSpec = {};
  for (url in routes) {
    n = url.split('*').length - 1; // Occurences of '*'
    arr = [];
    for (i = 0; i < n; ++i) arr[i] = any;
    arr.push(Object);
    typeSpec[routes[url]] = arr;
  }
  return Type(typeSpec);
}

function init(spec) {
  var url;
  var stream = spec.stream || flyd.stream();
  var type = createType(spec.routes);
  for (url in spec.routes) {
    spec.routes[url] = createFn(spec.constr, stream, type[spec.routes[url]]);
  }
  var r = ryter.init(spec);
  r.stream = stream;
  r.Action = type;
  return r;
}

module.exports = {
  init: init,
  navigate: ryter.navigate,
  destroy: ryter.destroy,
  Change: Change,
};
