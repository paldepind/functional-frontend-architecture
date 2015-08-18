# Nesting example

[View example here](http://paldepind.github.io/functional-frontend-architecture/examples/nesting/)

This example demonstrates two things:

## How to create 'module constructors'

In this example `List` is not a module with the typical module exports (`init`,
`update`, `view` and `Actions`) it is instead a function that creates an object
with these properties. The function takes another module and returns a list that
contains items of that module.

`List` only makes an assumption on how its content should be initialized but is
otherwise completly agnostic of what is contains. This is example shows how it
completely unmodified can contain the `Counter` module from the counter example
as well as a new `Switch` component.

## How deeper nesting looks using the architecture

This application demonstates a three level nesting. The top level handles tabs
of lists of counters/switches. Notice how the top level is completely unaware
about whether or not the content of the tabs contains nesting as well.

Each level is only concerned with any levels _directly_ beneath it and not at
all concerned with levels above it. This ensures that additional nesting can be
added to a module without affecting it's parent and that a module can be nested
deeply inside other modules without it having any knowledge about it.

The above should ensure that nesting to arbitrary levels is completely
straightforward without the routing of actions getting out of control.

