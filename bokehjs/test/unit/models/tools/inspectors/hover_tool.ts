import {expect, expect_not_null} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import type {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {Scatter} from "@bokehjs/models/glyphs/scatter"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import type {GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {HoverToolView, TooltipVars} from "@bokehjs/models/tools/inspectors/hover_tool"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import {ValidationError} from "@bokehjs/core/properties"
import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {isNumber} from "@bokehjs/core/util/types"
import type {VNode} from "@bokehjs/core/vdom"
import {assert} from "@bokehjs/core/util/assert"

import {render} from "preact"

function outer_html(el: Element | VNode): string {
  if (el instanceof Element) {
    return el.outerHTML
  } else {
    const parent = document.createElement("div")
    render(el, parent)
    return parent.innerHTML
  }
}

function outer_dom(el: Element | VNode): Element {
  if (el instanceof Element) {
    return el
  } else {
    const parent = document.createElement("div")
    render(el, parent)
    assert(parent.childElementCount == 1)
    return parent.children[0]
  }
}

async function make_testcase(): Promise<{hover_view: HoverToolView, data_source: ColumnDataSource, glyph_view: ScatterView}> {
  const data = {x: [0, 0.5, 1], y: [0, 0.5, 1]}
  const data_source = new ColumnDataSource({data})

  const glyph = new Scatter({x: {field: "x"}, y: {field: "y"}})
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
      expect(outer_dom(el0).childElementCount).to.be.equal(3)

      hover_view.model.tooltips = [["foo", "$x"]]
      await hover_view.ready

      const el1 = hover_view._render_tooltips(data_source, vars)
      expect_not_null(el1)
      expect(outer_dom(el1).childElementCount).to.be.equal(1)

      hover_view.model.tooltips = "<b>foo</b> is <i>$x</i>"
      await hover_view.ready

      const el2 = hover_view._render_tooltips(data_source, vars)
      expect_not_null(el2)
      expect(outer_dom(el2).childElementCount).to.be.equal(2)
    })
  })

  it("should allow to render various combinations of color[hex] and swatch", async () => {
    const tooltips: [string, string][] = [
      ["type", "$type"],
      ["index", "$index"],
      ["(x,y)", "($x, $y)"],
      ["radius", "@radius"],
      ["hex & swatch (known)", "$color[hex, swatch]:fill_color"],
      ["swatch & hex (known)", "$color[swatch, hex]:fill_color"],
      ["hex, swatch (known)", "$color[hex]:fill_color $swatch:fill_color"],
      ["swatch, hex (known)", "$swatch:fill_color $color[hex]:fill_color"],
      ["hex (known)", "$color[hex]:fill_color"],
      ["swatch (known)", "$swatch:fill_color"],
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

    const html = `\
<div class="bk-tooltip-entry">
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">type: </div>
    <div class="bk-tooltip-row-value">
      <span>Circle</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">index: </div>
    <div class="bk-tooltip-row-value">
      <span>0</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">(x,y): </div>
    <div class="bk-tooltip-row-value">
      <span>(10, 20)</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">radius: </div>
    <div class="bk-tooltip-row-value">
      <span>0.200</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">hex &amp; swatch (known): </div>
    <div class="bk-tooltip-row-value">
      <span><pre>#ff0000</pre></span>
      <span class="bk-tooltip-color-block" style="background-color: red;"></span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">swatch &amp; hex (known): </div>
    <div class="bk-tooltip-row-value">
      <span><pre>#ff0000</pre></span>
      <span class="bk-tooltip-color-block" style="background-color: red;"></span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">hex, swatch (known): </div>
    <div class="bk-tooltip-row-value">
      <span class="bk-tooltip-color-block" style="background-color: red;"></span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">swatch, hex (known): </div>
    <div class="bk-tooltip-row-value">
      <span class="bk-tooltip-color-block" style="background-color: red;"></span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">hex (known): </div>
    <div class="bk-tooltip-row-value">
      <span><pre>#ff0000</pre></span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">swatch (known): </div>
    <div class="bk-tooltip-row-value">
      <span class="bk-tooltip-color-block" style="background-color: red;"></span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">hex &amp; swatch (unknown): </div>
    <div class="bk-tooltip-row-value">
      <span>__colors unknown</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">swatch &amp; hex (unknown): </div>
    <div class="bk-tooltip-row-value">
      <span>__colors unknown</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">hex, swatch (unknown): </div>
    <div class="bk-tooltip-row-value">
      <span>__colors unknown</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">swatch, hex (unknown): </div>
    <div class="bk-tooltip-row-value">
      <span>__colors unknown</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">hex (unknown): </div>
    <div class="bk-tooltip-row-value">
      <span>__colors unknown</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">swatch (unknown): </div>
    <div class="bk-tooltip-row-value">
      <span>__colors unknown</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">foo: </div>
    <div class="bk-tooltip-row-value">
      <span>abcd</span>
    </div>
  </div>
  <div class="bk-tooltip-row">
    <div class="bk-tooltip-row-label">bar: </div>
    <div class="bk-tooltip-row-value">
      <span>-1</span>
    </div>
  </div>
</div>
`
    expect(outer_html(el)).to.be.equal(html.trim().split("\n").map((s) => s.trim()).join(""))
  })

  const test_case = async () => {
    const hover = new HoverTool()
    const p = fig([200, 200], {tools: [hover]})
    const r = p.circle({
      x: [1, 1, 1, 1, 1, 1],
      y: [2, 2, 2, 2, 2, 2],
      radius: [0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
      fill_color: ["red", "green", "blue", "yellow", "pink", "purple"],
      source: {
        foo: [1, 1, 1, 2, 2, 2],
        bar: [3, 2, 1, 3, 2, 1],
      },
    })

    const {view} = await display(p)

    const hv = view.owner.get_one(hover)
    const gv = view.owner.get_one(r)

    const hover_at = (hv: HoverToolView, gv: GlyphRendererView, x: number = NaN, y: number = NaN) => {
      if (isFinite(x + y)) {
        const sx = gv.coordinates.x_scale.compute(x)
        const sy = gv.coordinates.y_scale.compute(y)
        hv._move({type: "move", sx, sy, modifiers: {shift: false, ctrl: false, alt: false}, native: new PointerEvent("pointermove")})
      } else {
        hv._move_exit()
      }
    }

    const indices = (hv: HoverToolView) => hv._current_entries.map(({vars}) => vars.index)

    const expect_indices = (expected_indices: number[]) => {
      hover_at(hv, gv, 1, 2)
      expect(indices(hv)).to.be.equal(expected_indices)
      hover_at(hv, gv)
      expect(indices(hv)).to.be.equal([])
    }

    return {hover, hover_view: hv, expect_indices}
  }

  it("should support limiting the number of entries", async () => {
    const {hover, expect_indices} = await test_case()

    hover.limit = null
    expect_indices([0, 1, 2, 3, 4, 5])

    hover.limit = 3
    expect_indices([0, 1, 2])

    hover.limit = 1
    expect_indices([0])

    hover.limit = 4
    expect_indices([0, 1, 2, 3])

    hover.limit = null
    expect_indices([0, 1, 2, 3, 4, 5])

    expect(() => hover.limit = 0).to.throw(ValidationError)
  })

  it("should support sorting entries", async () => {
    const {hover, expect_indices} = await test_case()

    hover.sort_by = null
    expect_indices([0, 1, 2, 3, 4, 5])

    hover.sort_by = "radius"
    expect_indices([5, 4, 3, 2, 1, 0])

    hover.sort_by = ["foo"]
    expect_indices([0, 1, 2, 3, 4, 5])

    hover.sort_by = [["foo", "ascending"]]
    expect_indices([0, 1, 2, 3, 4, 5])

    hover.sort_by = [["foo", 1]]
    expect_indices([0, 1, 2, 3, 4, 5])

    hover.sort_by = [["foo", "descending"]]
    expect_indices([3, 4, 5, 0, 1, 2])

    hover.sort_by = [["foo", -1]]
    expect_indices([3, 4, 5, 0, 1, 2])

    hover.sort_by = ["foo", "bar"]
    expect_indices([2, 1, 0, 5, 4, 3])

    hover.sort_by = [["foo", "descending"], "bar"]
    expect_indices([5, 4, 3, 2, 1, 0])

    hover.sort_by = [["foo", -1], "bar"]
    expect_indices([5, 4, 3, 2, 1, 0])

    hover.sort_by = [["foo", "descending"], ["bar", "descending"]]
    expect_indices([3, 4, 5, 0, 1, 2])

    hover.sort_by = [["foo", -1], ["bar", -1]]
    expect_indices([3, 4, 5, 0, 1, 2])

    hover.sort_by = null
    expect_indices([0, 1, 2, 3, 4, 5])
  })

  it("should support filtering entries", async () => {
    const {hover, hover_view, expect_indices} = await test_case()

    hover.filters = {}
    await hover_view.ready
    expect_indices([0, 1, 2, 3, 4, 5])

    hover.filters = {"@radius": new CustomJS({code: "export default (args, tool, {value}) => value >= 0.4"})}
    await hover_view.ready
    expect_indices([0, 1, 2])

    hover.filters = {"@radius": (_, {value}) => isNumber(value) && value >= 0.4}
    await hover_view.ready
    expect_indices([0, 1, 2])

    hover.filters = {"@radius": new CustomJS({code: "export default (args, tool, {value}) => value < 0.4"})}
    await hover_view.ready
    expect_indices([3, 4, 5])

    hover.filters = {"@radius": (_, {value}) => isNumber(value) && value < 0.4}
    await hover_view.ready
    expect_indices([3, 4, 5])

    hover.filters = {
      "@foo": new CustomJS({code: "export default (args, tool, {value: foo}) => foo == 2"}),
      "@bar": new CustomJS({code: "export default (args, tool, {value: bar}) => bar % 2 == 1"}),
    }
    await hover_view.ready
    expect_indices([3, 5])

    hover.filters = {
      "@foo": (_, {value: foo}) => isNumber(foo) && foo == 2,
      "@bar": (_, {value: bar}) => isNumber(bar) && bar % 2 == 1,
    }
    await hover_view.ready
    expect_indices([3, 5])

    hover.filters = {"@foo": (_, {row: {foo, bar}}) => isNumber(foo) && foo == 1 && isNumber(bar) && bar % 2 == 1}
    await hover_view.ready
    expect_indices([0, 2])

    hover.filters = {}
    await hover_view.ready
    expect_indices([0, 1, 2, 3, 4, 5])
  })

  it("should allow filtering, sorting and limits simultaneously", async () => {
    const {hover, hover_view, expect_indices} = await test_case()

    hover.filters = {}
    hover.sort_by = null
    hover.limit = null
    await hover_view.ready
    expect_indices([0, 1, 2, 3, 4, 5])

    hover.filters = {"@bar": (_, {value: bar}) => isNumber(bar) && bar % 2 == 1}
    hover.sort_by = "fill_color"
    hover.limit = 3
    await hover_view.ready
    expect_indices([2, 5, 0])

    hover.filters = {}
    hover.sort_by = null
    hover.limit = null
    await hover_view.ready
    expect_indices([0, 1, 2, 3, 4, 5])
  })
})
