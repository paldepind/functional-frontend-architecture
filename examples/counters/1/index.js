var R = require('ramda');
var Type = require('union-type-js');
var flyd = require('flyd');
var stream = flyd.stream;
var snabbdom = require('snabbdom');
var h = snabbdom.h;


// Update
var Actions = Type({Increment: [], Decrement: []});

function update(model, action) {
  return Type.case({
    Increment: function() { return model + 1; },
    Decrement: function() { return model - 1; },
  }, action);
}

// View
var view = R.curry(function(actions$, model) {
  return h('div', {style: countStyle}, [
    h('button', {onclick: [actions$, Actions.Decrement()]}, '–'),
    h('div', {style: countStyle}, model),
    h('button', {onclick: [actions$, Actions.Increment()]}, '+'),
  ]);
});

countStyle = {
  fontSize: '20px',
  fontFamily: 'monospace',
  width: '50px',
  textAlign: 'center',
};

// Streams
var actions$ = stream(); // All modifications to the state originate here
var model$ = flyd.scan(update, 0, actions$); // Contains the entire state of the application
var vnode$ = flyd.map(view(actions$), model$); // Stream of virtual nodes to render

// flyd.map(console.log.bind(console), model$); // Uncomment to log state on every update

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', function() {
  var container = document.getElementById('container');
  flyd.scan(snabbdom.patch, snabbdom.emptyNodeAt(container), vnode$);
});
