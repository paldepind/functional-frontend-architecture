# noname-functional-frontend-framework

This repository is meant to document and explore the implementation of what is
know as "the Elm architecture". A simple functional architecture for building
frontend applications.

# High level overview

The entire state is contained in a single data structure. Things can happend
and the state should change accordingly. The number of things that can happend
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
  controlled manner through FRP
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

Check out the examples. [Here is at TodoMVC
implementation](http://paldepind.github.io/noname-functional-frontend-framework/examples/todo/) that is _almost_
only pure functions.

# Libraries

The architecture is implementation independent. It can be implemented with
varied combinations of libraries. It only requires a virtual DOM library and a
way to update JavaScript data structures without mutations. Having a nice
representation of actions is also useful.

* [Ramda](http://ramdajs.com/)
* [union-type](https://github.com/paldepind/union-type)
* [Flyd](https://github.com/paldepind/flyd)
* [Snabbdom](https://github.com/paldepind/snabbdom)
