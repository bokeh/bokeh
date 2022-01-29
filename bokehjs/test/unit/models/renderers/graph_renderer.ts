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

type GraphComponents = {
  test_graph: GraphRenderer
  test_layout_provider: StaticLayoutProvider
  test_document: Document
}

async function create_graph_document(): Promise<GraphComponents> {
  const layout_provider = new StaticLayoutProvider({
    graph_layout: new Map([
      [4, [2, 1]],
      [5, [2, 2]],
      [6, [3, 1]],
      [7, [3, 2]],
    ]),
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
  const plot_view = await build_view(plot)
  plot_view.build()

  return {
    test_graph: graph,
    test_layout_provider: layout_provider,
    test_document: doc,
  }
}

describe("GraphRendererView", () => {
  it("should have node_renderer and edge_renderer glyphs serializable after initialization", async () => {
    const {test_document} = await create_graph_document()
    expect(() => test_document.to_json(true)).to.not.throw(SerializationError)
  })

  it("should have new x and y coordinates after graph_layout is changed", async () => {
    const {test_graph, test_layout_provider} = await create_graph_document()

    test_layout_provider.graph_layout = new Map([
      [4, [3, 0]],
      [5, [4, 1]],
      [6, [5, 2]],
      [7, [6, 3]],
    ])
    test_graph.layout_provider = test_layout_provider

    const {x, y} = test_graph.layout_provider.node_coordinates.v_compute(test_graph.node_renderer.data_source)
    expect(x).to.be.equal(new Float64Array([3, 4, 5, 6]))
    expect(y).to.be.equal(new Float64Array([0, 1, 2, 3]))
  })
})
