# Counters example

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
