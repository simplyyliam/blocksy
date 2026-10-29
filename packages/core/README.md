# @blocksy/core

The heart of Blocksy: the project model and its schema, the `formatVersion` migrations, the registries every element, node and tool plugs into, and the command and event systems that give undo/redo. It imports no other `@blocksy` package, so everything else can depend on it without creating cycles.
