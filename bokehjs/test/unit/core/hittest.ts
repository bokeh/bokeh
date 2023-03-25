import {expect} from "assertions"

import * as hittest from "@bokehjs/core/hittest"

describe("hittest module", () => {

  it("should return false if (x,y) point is outside an ellipse, true if inside", () => {
    expect(hittest.point_in_ellipse(2, 1, 0, 1.5, 1, 1, 1)).to.be.true
    expect(hittest.point_in_ellipse(2, 1, Math.PI/4, 1.5, 1, 1, 1)).to.be.true
    expect(hittest.point_in_ellipse(2.1, 1, 0, 1.5, 1, 1, 1)).to.be.false
  })

  it("should return false if (x,y) point is outside a polygon, true if inside", () => {
    expect(hittest.point_in_poly(1.5, 5, [1, 2, 2, 1], [4, 5, 8, 9])).to.be.true
    expect(hittest.point_in_poly(1.01, 4, [1, 2, 2, 1], [4, 5, 8, 9])).to.be.false
  })
})
