# packages/nodes

One package per node family (logic, math, world, items, ...).

Every node family becomes its own package in a folder here, for example
`packages/nodes/math` named `@blocksy/nodes-math`. Each one holds its pin
definitions and types, inspector fields, code templates, Docs pages, example
graphs and tests, and plugs into the node registry in `@blocksy/core` with one
registration line. Nothing else in the repo changes when a family is added.
