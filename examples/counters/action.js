var R = require('ramda');

function Action(group, name, nrOfValues) {
  var constructor = R.curryN(nrOfValues, function() {
    var args = Array.prototype.slice.call(arguments);
    args.name = name;
    args.of = group;
    //args.is = constructor;
    return args;
  });
  return constructor;
}

var of = R.curry(function(group, act) {
  return group === act.of;
});

var is = R.curry(function(constructor, act) {
  return constructor === act.of[act.name];
});

var caze = R.curry(function(action, cases) {
  return cases[action.name].call(undefined, action);
});

function create(desc) {
  var obj = {};
  for (var key in desc) {
    obj[key] = Action(obj, key, desc[key]);
  }
  return obj;
}

module.exports = {create: create, is: is, of: of, case: caze};

