# Zip Code

This example implements a US zip code checker. It demonstrates how to do
asynchronous side effects such as fetching JSON data in a controlled way
that does not corrupt the purity of the application.

It uses futures from [ramda-fantasy](https://github.com/ramda/ramda-fantasy)
for the asynchron requests.

# How to build it

Install the dependencies.

```shell
npm install
```

Then build the code with

```shell
npm run build
```

With live reloading,

```shell
npm run dev
```
