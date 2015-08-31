/* globals: window, document */

import flip from 'ramda/src/flip'

import flyd from 'ramda/src/flyd'

import snabbdom from 'snabbdom'
import cl from 'snabbdom/modules/class'
import pr from 'snabbdom/modules/props'
import ev from 'snabbdom/modules/eventlistenters'
import st from 'snabbdom/modules/style'
const patch = snabbdom.init([cl,pr,ev,st]);

const throwOr = (fn) => {
  return (x) => {
    if (x instanceof Error) throw x; 
    return fn(x);
  }
}


const app = require('./app.js')

const update = (action, state) => {
  const [state1,tasks] = app.update(act,state); 
  tasks.map((t) => t.fork( throwOr(action$), action$) );
  return state1;
}

const action$ = flyd.stream();
const state$ = flyd.scan( flip(update), app.init(), action$);
const vnode$ = flyd.map( app.view({action$}), state$);

// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('container');
  flyd.scan(patch, el, vnode$);
})

