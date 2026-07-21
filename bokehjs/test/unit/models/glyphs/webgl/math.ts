import {expect} from "#framework/assertions"

import {gcd} from "@bokehjs/models/glyphs/webgl/utils/math"

describe("WebGL math utilities", () => {
  it("should return zero for empty and all-zero inputs", () => {
    expect(gcd([])).to.be.equal(0)
    expect(gcd([0])).to.be.equal(0)
    expect(gcd([0, 0])).to.be.equal(0)
  })

  it("should ignore zero values and operand signs", () => {
    expect(gcd([0, 6, 9])).to.be.equal(3)
    expect(gcd([-8, 0, 12])).to.be.equal(4)
    expect(gcd([-8, -12])).to.be.equal(4)
  })
})
