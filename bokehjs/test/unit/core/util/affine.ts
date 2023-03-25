import {expect} from "assertions"

import {AffineTransform} from "@bokehjs/core/util/affine"

describe("core/util/affine", () => {
  it("should support AffineTransform.clone()", () => {
    const tr0 = new AffineTransform()
    const tr1 = tr0.clone()
    expect(tr0).to.not.be.identical(tr1)
    expect(tr0).to.be.equal(tr1)
  })

  it("should support AffineTransform.reset()", () => {
    const tr0 = new AffineTransform()
    const tr1 = new AffineTransform(5, 3, 4, 2, 1, 0)
    const tr2 = tr1.clone()

    expect(tr0.is_identity).to.be.true
    expect(tr1.is_identity).to.be.false
    expect(tr2.is_identity).to.be.false

    tr1.reset()
    expect(tr1).to.be.equal(tr0)
    expect(tr1).to.not.be.equal(tr2)

    expect(tr0.is_identity).to.be.true
    expect(tr1.is_identity).to.be.true
    expect(tr2.is_identity).to.be.false
  })

  it("should support AffineTransform.translate()", () => {
    const tr0 = new AffineTransform()
    tr0.translate(1, 1)
    const tr1 = new AffineTransform(1, 0, 0, 1, 1, 1)
    expect(tr0).to.be.equal(tr1)
  })

  it("should support AffineTransform.apply()", () => {
    const tr0 = new AffineTransform()
    tr0.translate(1, 1)
    expect(tr0.apply(0, 0)).to.be.equal([1, 1])
  })
})
