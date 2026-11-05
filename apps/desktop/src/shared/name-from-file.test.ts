import { describe, expect, it } from "vitest"
import { nameFromFile } from "./name-from-file"

describe("nameFromFile", () => {
  it("turns file names into element names", () => {
    expect(nameFromFile("berry_dough.png")).toBe("Berry Dough")
    expect(nameFromFile("ruby-block.final.png")).toBe("Ruby Block.Final")
    expect(nameFromFile(".png")).toBe("Imported")
  })
})
