import {expect} from "assertions"

import {compute_renderers} from "@bokehjs/models/util"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {GraphRenderer} from "@bokehjs/models/renderers/graph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

const data_source = new ColumnDataSource()

const g0 = new GlyphRenderer({data_source})
const g1 = new GlyphRenderer({data_source})
const g2 = new GraphRenderer()

describe("compute_renderers", () => {

  it("should return empty list for renderers=null", () => {
    const r0 = compute_renderers(null, [])
    expect(r0).to.be.equal([])

    const r1 = compute_renderers(null, [g0, g1, g2])
    expect(r1).to.be.equal([])
  })

  it("should return empty list for renderers=[]", () => {
    const r0 = compute_renderers([], [])
    expect(r0).to.be.equal([])

    const r1 = compute_renderers([], [g0, g1, g2])
    expect(r1).to.be.equal([])
  })

  it("should return all_renderers for renderers='auto'", () => {
    const r = compute_renderers("auto", [g0, g1, g2])
    expect(r).to.be.equal([g0, g1, g2])
  })
})
