import {expect} from "assertions"

import {UniformScalar, UniformVector, min, max} from "@bokehjs/core/uniforms"

describe("core/uniforms", () => {

  it("should support min() function", () => {
    const u0 = new UniformScalar(1.1, 100)
    const u1 = new UniformVector([0, 1.1, -10.2, 10.1, 20.2, 20.1, 2])

    expect(min(u0)).to.be.equal(1.1)
    expect(min(u1)).to.be.equal(-10.2)
  })

  it("should support max() function", () => {
    const u0 = new UniformScalar(1.1, 100)
    const u1 = new UniformVector([0, 1.1, -10.2, 10.1, 20.2, 20.1, 2])

    expect(max(u0)).to.be.equal(1.1)
    expect(max(u1)).to.be.equal(20.2)
  })
})
