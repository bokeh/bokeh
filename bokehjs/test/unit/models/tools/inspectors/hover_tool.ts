import {expect} from "assertions"
import {assert} from "@bokehjs/core/util/assert"
import {build_view} from "@bokehjs/core/build_views"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Circle} from "@bokehjs/models/glyphs/circle"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"

import {HoverTool, HoverToolView} from "@bokehjs/models/tools/inspectors/hover_tool"

async function make_testcase(): Promise<{hover_view: HoverToolView, data_source: ColumnDataSource}> {
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
  })

  const data = {x: [0, 0.5, 1], y: [0, 0.5, 1]}
  const data_source = new ColumnDataSource({data})

  const glyph = new Circle({x: {field: "x"}, y: {field: "y"}})
  const glyph_renderer = new GlyphRenderer({glyph, data_source})

  const hover_tool = new HoverTool({active: true, renderers: [glyph_renderer]})
  plot.add_tools(hover_tool)

  const plot_view = (await build_view(plot)).build()
  const hover_view = plot_view.tool_views.get(hover_tool)! as HoverToolView

  return {hover_view, data_source}
}

describe("HoverTool", () => {

  describe("View", () => {

    it("should invalidate tooltips' template when changing the tooltips property", async () => {
      const {hover_view, data_source} = await make_testcase()

      const el0 = hover_view._render_tooltips(data_source, 0, {index: 0, x: 123, y: 456, sx: 0, sy: 0})
      assert(el0 != null)
      expect(el0.childElementCount).to.be.equal(3)

      hover_view.model.tooltips = [["foo", "$x"]]
      await hover_view.ready

      const el1 = hover_view._render_tooltips(data_source, 0, {index: 0, x: 123, y: 456})
      assert(el1 != null)
      expect(el1.childElementCount).to.be.equal(1)

      hover_view.model.tooltips = "<b>foo</b> is <i>$x</i>"
      await hover_view.ready

      const el2 = hover_view._render_tooltips(data_source, 0, {index: 0, x: 123, y: 456})
      assert(el2 != null)
      expect(el2.childElementCount).to.be.equal(2)
    })
  })
})
