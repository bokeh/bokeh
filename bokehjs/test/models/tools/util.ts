import {expect} from "chai"

import {compute_renderers} from "models/tools/util"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {GraphRenderer} from "models/renderers/graph_renderer"

const g0 = new GlyphRenderer({name: "g0"})
const g1 = new GlyphRenderer({name: "g1"})
const g2 = new GraphRenderer({name: "g2"})

describe("compute_renderers", () => {

  it("should return empty list for renderers=null", () => {
    const r0 = compute_renderers(null, [], [])
    expect(r0).to.be.deep.equal([])

    const r1 = compute_renderers(null, [g0, g1, g2], [])
    expect(r1).to.be.deep.equal([])

    const r2 = compute_renderers(null, [g0, g1, g2], ["g1"])
    expect(r2).to.be.deep.equal([])
  })

  it("should return empty list for renderers=[]", () => {
    const r0 = compute_renderers([], [], [])
    expect(r0).to.be.deep.equal([])

    const r1 = compute_renderers([], [g0, g1, g2], [])
    expect(r1).to.be.deep.equal([])

    const r2 = compute_renderers([], [g0, g1, g2], ["g1"])
    expect(r2).to.be.deep.equal([])
  })

  it("should return all_renderers for renderers='auto'", () => {
    const r = compute_renderers('auto', [g0, g1, g2], [])
    expect(r).to.be.deep.equal([g0, g1, g2])
  })

  it("should filter renderers by names", () => {
    const r0 = compute_renderers([g0, g1], [g0, g1, g2], ["g0"])
    expect(r0).to.be.deep.equal([g0])

    const r1 = compute_renderers([g0, g1, g2], [], ["g0", "g2"])
    expect(r1).to.be.deep.equal([g0, g2])

    const r2 = compute_renderers('auto', [g0, g1, g2], ["g0", "g2"])
    expect(r2).to.be.deep.equal([g0, g2])
  })
})
