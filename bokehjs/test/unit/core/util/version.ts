import {expect} from "assertions"
import {pyify_version} from "@bokehjs/core/util/version"

describe("core/util/version module", () => {
  it("should implement pyify_version() function for full versions", () => {
    const out = pyify_version("1.2.3")
    expect(out).to.be.equal("1.2.3")
  })

  it("should implement pyify_version() function for dev versions", () => {
    const out = pyify_version("1.2.3-dev.18")
    expect(out).to.be.equal("1.2.3.dev18")
  })

  it("should implement pyify_version() function for rc versions", () => {
    const out = pyify_version("1.2.3-rc.18")
    expect(out).to.be.equal("1.2.3.rc18")
  })
})
