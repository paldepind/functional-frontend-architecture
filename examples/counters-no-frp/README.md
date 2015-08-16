# Counters example without FRP

This is a counters example implemented with Snabbdom, union-type and Ramda. It
is similair to the [counters example](../counters) expect it doesn't use FRP to
bootstrap the architecture. Instead it uses an
[asynchronously recursive main function](1/main.js#L36-L42) as described in the
article [React-less Virtual DOM with Snabbdom](https://medium.com/@yelouafi/react-less-virtual-dom-with-snabbdom-functions-everywhere-53b672cb2fe3).

If you want to see the difference between the FRP dependent counters example
and this one you can run:

```
git diff --no-index -- ../counters/2/main.js 2/main.js
```

The only changes are in the main file and replacing `forwardTo` with plain
function composition.

# How to build it

Install the dependencies.

```javascript
npm install
```

Then go to either of the subdirectories and build the code with

```javascript
browserify main.js -t babelify --outfile build.js
```

With live reloading,

```javascript
npm install -g watchify browser-sync
watchify main.js -v -t babelify --outfile build.js \
  & browser-sync start --server --files="index.html, build.js"
```
