import {expect} from "assertions"
import {display, fig} from "_util"

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

  it("should allow to render various combinations of color[hex] and swatch", async () => {
    const tooltips: [string, string][] = [
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

    const hover_view = view.tool_views.get(hover)! as HoverTool["__view_type__"]
    const el = hover_view._render_tooltips(r.data_source, 0, {index: 0, x: 10, y: 20})

    const html =
`
<div class="bk" style="display: table; border-spacing: 2px;">
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">index: </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">0</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">(x,y): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">(10, 20)</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">radius: </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">0.200</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">hex &amp; swatch (known): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">swatch &amp; hex (known): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">hex, swatch (known): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">swatch, hex (known): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">hex (known): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">swatch (known): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">hex &amp; swatch (unknown): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">__colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">swatch &amp; hex (unknown): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">__colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">hex, swatch (unknown): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">__colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">swatch, hex (unknown): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">__colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">hex (unknown): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">__colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">swatch (unknown): </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">__colors unknown</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">foo: </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">abcd</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
  <div class="bk" style="display: table-row;">
    <div class="bk bk-tooltip-row-label" style="display: table-cell;">bar: </div>
    <div class="bk bk-tooltip-row-value" style="display: table-cell;">
      <span class="bk" data-value="">-1</span>
      <span class="bk bk-tooltip-color-block" data-swatch="" style="display: none;"> </span>
    </div>
  </div>
</div>
`
    expect(el!.outerHTML).to.be.equal(html.trim().split("\n").map((s) => s.trim()).join(""))
  })
})
