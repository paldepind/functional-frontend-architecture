# Autocomplete

This example implements postal code lookup in the form of an [autocomplete][wp] 
menu. You select the country and type in a location and state/province/
department etc., and the postal codes matching that location are presented in a 
menu. (Lookups done via [zippopotam.us][zippo]).

The primary aims of this example are to demonstrate:

- How to do nested asynchronous side effects in a controlled way. [Flyd][flyd] 
  streams are used here to manage state, for a simpler method see the 
  [zip-codes-future][zip] example, which this example builds upon.

- How error conditions can be routed to actions, even to nested components,
  using `Future.bimap` (using the [ramda-fantasy implementation][fut]).

- Composition of a complex Future chain for processing input into query results.

- [Maybe][maybe] instead of null values.

- Use of parameterized sub-components within an application.

- Handling contextual keydown events.

- Using snabbdom hooks to reposition the (absolute-positioned) menu relative to
  the input.

- Input debouncing (planned, not yet implemented).

- Build toolchain using `make`, [jspm][jspm], and [tape][tape], [testem][testem] 
  with [source-map-support][sms] for tests.


## How to build it

Install the dependencies.

```
npm install -g jspm
jspm install
```

Then build the code with

```
make build
```

Run the tests

```
testem
```

_Note that the app tests currently fail in Node and Phantomjs because of lack of
support for `fetch`. I'm sure there's a way around this but for now, open your 
browser(s) while running `testem` to see test results._


## How to use it

```
python -m SimpleHTTPServer 8080   # or your favorite static file server
```

Browse to `http://localhost:8080/index.html`.



[wp]: https://en.wikipedia.org/wiki/Autocomplete
[zip]: https://github.com/paldepind/functional-frontend-architecture/tree/master/examples/zip-codes-future
[zippo]: http://zippopotam.us
[fut]:  https://github.com/ramda/ramda-fantasy/tree/master/src/Future.js
[maybe]:  https://github.com/ramda/ramda-fantasy/tree/master/src/Maybe.js
[flyd]: https://github.com/paldepind/flyd
[jspm]: http://jspm.io
[tape]: https://github.com/substack/tape
[testem]: https://github.com/airportyh/testem
[sms]: https://github.com/evanw/node-source-map-support

