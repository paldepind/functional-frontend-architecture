# noname-functional-frontend-framework
A functional frontend framework.

Work in progress.

# Goals/ideas

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

Nothing to see here yet. Check out the examples. [Here is at TodoMVC
implementation](http://paldepind.github.io/noname-functional-frontend-framework/examples/todo/) that is _almost_
only pure functions.

# What it is

[Ramda](http://ramdajs.com/) +
[union-type](https://github.com/paldepind/union-type) +
[Flyd](https://github.com/paldepind/flyd) +
[Snabbdom](https://github.com/paldepind/snabbdom) + a lot of inspiration from
[Elm](http://elm-lang.org/) = a functional JavaScript frontend framework for
writing web applications with no state mutations.

