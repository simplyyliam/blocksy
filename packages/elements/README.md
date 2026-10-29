# packages/elements

One package per element type (block, item, block entity, GUI, entity, ...).

Every element type becomes its own package in a folder here, for example
`packages/elements/block` named `@blocksy/element-block`. Each one holds its
schema, default values, editor panel, generator templates, Docs reference page
and tests, and plugs into the element registry in `@blocksy/core` with one
registration line. Nothing else in the repo changes when an element is added.
