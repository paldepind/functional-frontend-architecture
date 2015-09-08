/* globals: window, document */

import flip from 'ramda/src/flip'

import flyd from 'flyd'

import snabbdom from 'snabbdom'
import cl from 'snabbdom/modules/class'
import pr from 'snabbdom/modules/props'
import at from 'snabbdom/modules/attributes'
import ev from 'snabbdom/modules/eventlisteners'
import st from 'snabbdom/modules/style'
const patch = snabbdom.init([cl,pr,at,ev,st]);

import app from './app'

const throwOr = (fn) => {
  return (x) => {
    if (x instanceof Error) throw x; 
    return fn(x);
  }
}


const update = (action, state) => {
  const [state1,tasks] = app.update(action,state); 
  tasks.map((t) => t.fork( throwOr(action$), action$) );
  return state1;
}

const action$ = flyd.stream();
const state$ = flyd.scan( flip(update), app.init(), action$);
const vnode$ = flyd.map( app.view({action$}), state$);

// enable this for debugging 
// flyd.on( console.log.bind(console), state$ );


// Begin rendering when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('container');
  flyd.scan(patch, el, vnode$);
})

