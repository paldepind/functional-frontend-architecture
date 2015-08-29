# File Uploader

This example is a browser-based file-upload component, i.e. it renders a list
of chosen files, shows their upload progress, and allows users to cancel 
uploads.

Similar to the [zip-code-futures][zip] example, it demonstrates a way to do
asynchronous side effects in a controlled way. The top-level update function 
(in `main.js`) was copied from that example. It features a convention for making
synchronous and asynchronous updates together which is very similar to Elm's
`effects`. You can read more about this in the [Elm architecture tutorial][elm].

It also features routing of nested updates, both synchronous (which 'bubble up'
the component tree in the familiar way, based on user events) and asynchronous 
(which are constructed via future chains of actions to 'dive down' the component 
tree, based on server responses). 

The uploader wraps XmlHttpRequest in a [ramda-fantasy][rf] Future, which 
repeatedly resolves on XHR progress events.


## How to build it

Install the dependencies.

```
npm install
```

Then build the code with

```
npm run build
```

Run the tests

```
npm run test
```


## How to use it

Create an uploads folder, if it doesn't already exist:

```
mkdir -p uploads
```

Start the test server

```
node server.js 8080
```

Then open your browser to `http://localhost:8080/index.html`, and choose some 
files to upload.


## Other notes

- The example is intended to be a step towards a realistic stand-alone
  file uploader, i.e. a 'widget' or reusable component. So `main` and `app`
  give a picture of how you would integrate it into a real app. Comments
  welcome on the app interface to the 'widget' (the `list` and `uploader`),
  I am sure it could be improved.

- 'Structural' styling is done via javacript, while app-specific styles can be
  applied via CSS.

- The XHR `abort` method is not handled in a pure way. This seems impossible,
  at least using the Future interface. So there is a bit of a 'wormhole'
  exposing this method back to the app and into the model, where it can be
  hooked up to a click handler. Other suggestions welcome.

- The tests include a simple dummy uploader for running unit tests independent 
  of XHR and the browser, an example of how easy it is to test using this 
  architecture.



[zip]: https://github.com/paldepind/functional-frontend-architecture/tree/master/examples/zip-codes-future
[elm]: https://github.com/evancz/elm-architecture-tutorial#example-5-random-gif-viewer
[rf]:  https://github.com/ramda/ramda-fantasy

