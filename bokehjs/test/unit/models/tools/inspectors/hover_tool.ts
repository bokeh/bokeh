import {expect, expect_not_null} from "assertions"
import {display, fig} from "../../../_util"

import type {CircleView} from "@bokehjs/models/glyphs/circle"
import {Circle} from "@bokehjs/models/glyphs/circle"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {HoverToolView, TooltipVars} from "@bokehjs/models/tools/inspectors/hover_tool"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"

async function make_testcase(): Promise<{hover_view: HoverToolView, data_source: ColumnDataSource, glyph_view: CircleView}> {
  const data = {x: [0, 0.5, 1], y: [0, 0.5, 1]}
  const data_source = new ColumnDataSource({data})

  const glyph = new Circle({x: {field: "x"}, y: {field: "y"}})
  const glyph_renderer = new GlyphRenderer({glyph, data_source})

  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
    renderers: [glyph_renderer],
  })

  const hover_tool = new HoverTool({active: true, renderers: [glyph_renderer]})
  plot.add_tools(hover_tool)

  const {view: plot_view} = await display(plot)

  const hover_view = plot_view.owner.get_one(hover_tool)
  const glyph_view = plot_view.owner.get_one(glyph_renderer.glyph)

  return {hover_view, data_source, glyph_view}
}

describe("HoverTool", () => {

  describe("View", () => {

    it("should invalidate tooltips' template when changing the tooltips property", async () => {
      const {hover_view, data_source, glyph_view} = await make_testcase()

      const vars: TooltipVars = {
        glyph_view,
        type: glyph_view.model.type,
        index: 0,
        x: 123,
        y: 456,
        sx: 0,
        sy: 0,
        snap_x: 1123,
        snap_y: 1456,
        snap_sx: 1000,
        snap_sy: 1000,
        name: "foo",
      }

      const el0 = hover_view._render_tooltips(data_source, vars)
      expect_not_null(el0)
      expect(el0.childElementCount).to.be.equal(3)

      hover_view.model.tooltips = [["foo", "$x"]]
      await hover_view.ready

      const el1 = hover_view._render_tooltips(data_source, vars)
      expect_not_null(el1)
      expect(el1.childElementCount).to.be.equal(1)

      hover_view.model.tooltips = "<b>foo</b> is <i>$x</i>"
      await hover_view.ready

      const el2 = hover_view._render_tooltips(data_source, vars)
      expect_not_null(el2)
      expect(el2.childElementCount).to.be.equal(2)
    })
  })

  it("should allow to render various combinations of color[hex] and swatch", async () => {
    const tooltips: [string, string][] = [
      ["type", "$type"],
      ["index", "$index"],
      ["(x,y)", "($x, $y)"],
      ["radius", "@radius"],
      ["hex & swatch (known)", "$color[hex, swatch]:colors"],
      ["swatch & hex (known)", "$color[swatch, hex]:colors"],
      ["hex, swatch (known)", "$color[hex]:colors $swatch:colors"],
      ["swatch, hex (known)", "$swatch:colors $color[hex]:colors"],
      ["hex (known)", "$color[hex]:colors"],
      ["swatch (known)", "$swatch:colors"],
      ["hex & swatch (unknown)", "$color[hex, swatch]:__colors"],
      ["swatch & hex (unknown)", "$color[swatch, hex]:__colors"],
      ["hex, swatch (unknown)", "$color[hex]:__colors $swatch:__colors"],
      ["swatch, hex (unknown)", "$swatch:__colors $color[hex]:__colors"],
      ["hex (unknown)", "$color[hex]:__colors"],
      ["swatch (unknown)", "$swatch:__colors"],
      ["foo", "@foo"],
      ["bar", "@bar"],
    ]

    const hover = new HoverTool({tooltips})
    const p = fig([200, 200], {tools: [hover]})
    const r = p.circle({
      x: [1, 2, 3],
      y: [4, 5, 6],
      radius: [0.2, 0.4, 0.6],
      fill_color: ["red", "green", "blue"],
      source: {
        foo: ["abcd", "bacd", "bcad"],
        bar: [-1, -2, -3],
      },
    })

    const {view} = await display(p)

    const hover_view = view.owner.get_one(hover)
    const glyph_view = view.owner.get_one(r.glyph)

    const vars: TooltipVars = {
      glyph_view,
      type: glyph_view.model.type,
      index: 0,
      x: 10,
      y: 20,
      sx: 0,
      sy: 0,
      snap_x: 1123,
      snap_y: 1456,
      snap_sx: 1000,
      snap_sy: 1000,
      name: "foo",
    }

    const el = hover_view._render_tooltips(r.data_source, vars)
    expect_not_null(el)

    const html =
`
<div style="display: table; border-spacing: 2px;">
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">type: </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">Circle</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">index: </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">0</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">(x,y): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">(10, 20)</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">radius: </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">0.200</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">hex &amp; swatch (known): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">swatch &amp; hex (known): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">hex, swatch (known): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">swatch, hex (known): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">hex (known): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">swatch (known): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">hex &amp; swatch (unknown): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">__colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">swatch &amp; hex (unknown): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">__colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">hex, swatch (unknown): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">__colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">swatch, hex (unknown): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">__colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">hex (unknown): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">__colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">swatch (unknown): </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">__colors unknown</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">foo: </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">abcd</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div style="display: table-row;">
    <div class="bk-tooltip-row-label" style="display: table-cell;">bar: </div>
    <div class="bk-tooltip-row-value" style="display: table-cell;">
      <span data-value="">-1</span>
      <span class="bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
</div>
`
    expect(el.outerHTML).to.be.equal(html.trim().split("\n").map((s) => s.trim()).join(""))
  })
})
