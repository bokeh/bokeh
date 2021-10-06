import {expect} from "assertions"

import {SpatialIndex} from "@bokehjs/core/util/spatial"
import * as bbox from "@bokehjs/core/util/bbox"

describe("core/util/spatial module", () => {
  it("support SpatialIndex.bounds()", () => {
    const index = new SpatialIndex(6)
    index.add_rect(0, 1, 1, 2)
    index.add_rect(0.0001, 1, 1, 2)
    index.add_rect(0, 100, 1, 200)
    index.add_rect(0.0001, 100, 1, 200)
    index.add_rect(0, 10, 1, 20)
    index.add_rect(0.0001, 10, 1, 20)
    index.finish()
    expect(index.bounds(bbox.positive_x())).to.be.equal({x0: 0.0001, x1: 1, y0: 1, y1: 200})
    expect(index.bounds(bbox.positive_y())).to.be.equal({x0: 0, x1: 1, y0: 1, y1: 200})
  })
})
