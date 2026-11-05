import { describe, expect, it } from "vitest"
import { latestDownload, overallProgress, timeLeft } from "./setup-progress"

describe("downloads", () => {
  it("names the newest download and reads its percentage", () => {
    const info = latestDownload([
      "Downloading https://services.gradle.org/distributions/gradle-9.8.2-bin.zip",
      ".........10%.........20%",
      "Downloading https://piston-data.mojang.com/v1/objects/abc/client.jar",
      "...30%..40%",
    ])
    expect(info).toEqual({ name: "client.jar", percent: 40, doneMb: null, totalMb: null })
  })

  it("reads megabytes when printed", () => {
    expect(latestDownload(["Downloading client.jar", "38.5 / 71 MB"])).toMatchObject({ name: "client.jar", doneMb: 38.5, totalMb: 71 })
  })

  it("returns null when nothing is downloading and ignores impossible percentages", () => {
    expect(latestDownload(["> Task :compileJava"])).toBeNull()
    expect(latestDownload(["Downloading x.jar", "250%"])?.percent).toBeNull()
  })
})

describe("overall progress", () => {
  it("grows with the step and the fraction inside it", () => {
    expect(overallProgress(-1, 0, false)).toBe(0)
    expect(overallProgress(2, 0, false)).toBeCloseTo(15 / 100)
    expect(overallProgress(2, 0.5, false)).toBeCloseTo((15 + 27.5) / 100)
    expect(overallProgress(5, 1, false)).toBe(1)
  })

  it("leaves out data generation for mods without blocks", () => {
    expect(overallProgress(5, 0, true)).toBeCloseTo(85 / 90)
  })
})

describe("time left", () => {
  it("stays quiet until it can say something useful", () => {
    expect(timeLeft(0.02, 100)).toBeNull()
    expect(timeLeft(0.5, 10)).toBeNull()
  })

  it("estimates from the pace so far", () => {
    expect(timeLeft(0.5, 120)).toBe("about 2 min left")
    expect(timeLeft(0.95, 200)).toBe("less than a minute left")
  })
})
