import {expect} from "assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GraphRenderer} from "@bokehjs/models/renderers/graph_renderer"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {StaticLayoutProvider} from "@bokehjs/models/graphs"
import {Circle, MultiLine} from "@bokehjs/models/glyphs"
import {Plot} from "@bokehjs/models/plots"
import {Document} from "@bokehjs/document"
import {build_view} from "@bokehjs/core/build_views"
import {SerializationError} from "@bokehjs/core/serializer"
import {XYGlyph} from "@bokehjs/models/glyphs/xy_glyph"
import {Expression} from "@bokehjs/models"

const layout_provider = new StaticLayoutProvider({
  graph_layout: {
    4: [2, 1],
    5: [2, 2],
    6: [3, 1],
    7: [3, 2],
  },
})

const node_renderer = new GlyphRenderer({
  glyph: new Circle({size: 10, fill_color: "red"}),
  data_source: new ColumnDataSource({data: {index: [4, 5, 6, 7]}}),
})
const edge_renderer = new GlyphRenderer({
  glyph: new MultiLine({line_width: 2, line_color: "gray"}),
  data_source: new ColumnDataSource({data: {start: [4, 4, 5, 6], end: [5, 6, 6, 7]}}),
})

const graph = new GraphRenderer({layout_provider, node_renderer, edge_renderer})

describe("GraphRendererView", () => {
  it("should have node_renderer and edge_renderer glyphs serializable after initialization", async () => {
    const plot = new Plot({renderers: [graph]})
    const doc = new Document()
    doc.add_root(plot)
    ;(await build_view(plot)).build()
    expect(() => doc.to_json(true)).to.not.throw(SerializationError)
  })

  it("should have new x and y coordinates after graph layout is changed", () => {
    layout_provider.graph_layout = {
      4: [3, 0],
      5: [4, 1],
      6: [5, 2],
      7: [6, 3],
    }

    graph.layout_provider = layout_provider

    const node_glyph = graph.node_renderer.glyph as XYGlyph
    const x = node_glyph.x as any
    const y = node_glyph.y as any
    const express_x = x.expr as Expression
    const express_y = y.expr as Expression
    expect(express_x.v_compute(graph.node_renderer.data_source)).to.be.equal(new Float64Array([3, 4, 5, 6]))
    expect(express_y.v_compute(graph.node_renderer.data_source)).to.be.equal(new Float64Array([0, 1, 2, 3]))
  })
})
