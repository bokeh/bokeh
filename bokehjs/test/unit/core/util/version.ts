import {expect} from "assertions"
import {Version, ReleaseType} from "@bokehjs/core/util/version"

describe("core/util/version module", () => {
  it("should implement Version.from() function for full versions", () => {
    const out = Version.from("1.2.3")
    expect(out).to.be.equal(new Version(1, 2, 3))
  })

  it("should implement Version.from() function for dev versions", () => {
    const ver0 = Version.from("1.2.3-dev.18")
    expect(ver0).to.be.equal(new Version(1, 2, 3, ReleaseType.Dev, 18))

    const ver1 = Version.from("1.2.3.dev18")
    expect(ver1).to.be.equal(new Version(1, 2, 3, ReleaseType.Dev, 18))
  })

  it("should implement Version.from() function for rc versions", () => {
    const ver0 = Version.from("1.2.3-rc.18")
    expect(ver0).to.be.equal(new Version(1, 2, 3, ReleaseType.Candidate, 18))

    const ver1 = Version.from("1.2.3rc18")
    expect(ver1).to.be.equal(new Version(1, 2, 3, ReleaseType.Candidate, 18))
  })
})
