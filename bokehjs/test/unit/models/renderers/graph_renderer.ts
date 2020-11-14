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

describe("GraphRendererView", () => {
  it("should have node_renderer and edge_renderer glyphs serializable after initialization", async () => {
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

    const plot = new Plot({renderers: [graph]})
    const doc = new Document()
    doc.add_root(plot)

    ;(await build_view(plot)).build()
    expect(() => doc.to_json(true)).to.not.throw(SerializationError)
  })
})
