import {expect} from "#framework/assertions"

import {smaller_loop} from "@bokehjs/models/glyphs/webgl/tessellator"

type HalfEdge = Parameters<typeof smaller_loop>[0]

function loop(length: number): HalfEdge {
  const edges = Array.from({length}, () => ({} as HalfEdge))
  for (let i = 0; i < edges.length; i++) {
    edges[i].lNext = edges[(i + 1) % edges.length]
  }
  return edges[0]
}

describe("tessellator helpers", () => {
  it("should select the first loop when it is smaller", () => {
    const a = loop(2), b = loop(5)
    expect(smaller_loop(a, b)).to.be.identical(a)
  })

  it("should select the second loop when it is smaller", () => {
    const a = loop(5), b = loop(2)
    expect(smaller_loop(a, b)).to.be.identical(b)
  })

  it("should select the first loop when their lengths are equal", () => {
    const a = loop(3), b = loop(3)
    expect(smaller_loop(a, b)).to.be.identical(a)
  })
})
