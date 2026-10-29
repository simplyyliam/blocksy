// @blocksy/generator: pure codegen engine, (project data, target) -> files, with golden tests.
// Public API of this package. Other packages may import only from here.
export { generate, GenerateError } from "./generate.ts"
export { fileTree } from "./tree.ts"
