# functional-frontend-architecture

This repository is meant to document and explore the implementation of what is
known as "the Elm architecture". A simple functional architecture for building
frontend applications.

# High level overview

The entire state is contained in a single data structure. Things can happen
and the state should change accordingly. The number of things that can happen
is described as a set of _actions_. Actions flow unidirectionally down the
application. Actions are handled by pure _update_ functions. Such a function
takes an action and a state and returns a new state. The state is handled to a
_view_ function that returns a virtual DOM representation. A module is an
encapsulated set of actions, an update function and a view function. Modules
can be nested inside other modules and modules can contain other modules. This
makes the architecture nestable and modular.

# Features/goals/ideas

* As few mutations in application code as possible. The vast majority of your
  application can be completely pure.
* Time changing values and interactions with the world is introduced in a
  controlled manner through FRP.
* Testing should be easy! And nothing is easier to test than pure side-effect
  free functions.
* State should be easily inspectable for debugging and serialization. Also,
  time travel.
* Minimalism and simplicity are center pieces in every used library.
* Actions should be expressed as [union types](https://github.com/paldepind/union-type).
* Everything should be modular. Ideally this GitHub repository should contain
  as little code as possible.

# Documentation

* [React-less Virtual DOM with Snabbdom: functions
  everywhere!](https://medium.com/@yelouafi/react-less-virtual-dom-with-snabbdom-functions-everywhere-53b672cb2fe3)
  – An article that introduces the virtual DOM library Snabbdom and step by
  step implements the Elm architecture with it.

# Examples

* [Counters example without FRP](examples/counters-no-frp) – This is several
  versions of a counters application. It starts out very simple and then
  gradualy increases in complexity. This is implemented with Snabbdom, union-type and Ramda.
* [Counters example with FRP](examples/counters) – This is similair to the above example but
  the architecture is bootstraped with Flyd as and FRP library.
* [Who to follow](examples/who-to-follow) – A small who to follow box using
  GitHubs API. It can be compared with a [plain FRP version using
  Flyd](https://github.com/paldepind/flyd/tree/master/examples/who-to-follow)
  and [one using Rx](http://jsfiddle.net/staltz/8jFJH/48/).
* [Zip codes](examples/zip-codes) – This is a translation of Elm's zip-codes
  example, designed to show how to use asyncronous tasks, specifically http
  requests. ES6 Promises are used here as stand-ins for Elm's Tasks.
* [TodoMVC](examples/todo) – A TodoMVC implementation built with Snabbdom,
  union-type, Ramda and Flyd.
* [Modal](examples/modal) – Demonstrates a technique for implementing modals.
* [Nesting](examples/nesting) – A simple application that demonstrates three
  level nesting of components. This is intended to show how the action-routing
  scales.

# Libraries

The architecture is implementation independent. It can be implemented with
varied combinations of libraries. It only requires a virtual DOM library and a
way to update JavaScript data structures without mutations. Having a nice
representation of actions is also useful.

## Virtual DOM libraries

The view layer in the architecture consists of pure functions that takes part
of the applications state and returns a description of it's view. Such a description
will typically be a virtual DOM representation that will later be rendered with a virtual
DOM library. A number of options exists.

* [Snabbdom](https://github.com/paldepind/snabbdom) – A small modular and
  extensible virtual DOM library with splendid performance.
* [virtual-dom](https://github.com/Matt-Esch/virtual-dom) – A popular virtual
  DOM library.
* [React](http://facebook.github.io/react/) – Mature and widely used. It
  supports JSX which many people like. It is however a bulky library. It
  supports stateful components which should not be used together with the
  architecture.

## Updating data structures

When handling actions inside `update` functions it is necessary to update ones
state without mutating it. Libraries can provide a help with regards to this.

* [Ramda](http://ramdajs.com/) – Ramda provides a huge amount of functions for
  working with native JavaScript data structures in a purely functional way.

## Representing actions

* [union-type](https://github.com/paldepind/union-type)
