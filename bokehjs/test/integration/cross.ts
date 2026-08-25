import {expect, expect_instanceof} from "#framework/assertions"
import {display} from "#framework/layouts"
import {actions, xy} from "#framework/interactive"

import json5 from "json5"

import {version} from "@bokehjs/version"
import type {DocJson} from "@bokehjs/document"
import {Document} from "@bokehjs/document"
import {BoxZoomTool, GlyphRenderer, PanTool} from "@bokehjs/models"
import {PlotView} from "@bokehjs/models/plots/plot"
import {GridPlotView} from "@bokehjs/models/plots/grid_plot"
import {ToolProxy} from "@bokehjs/models/tools/tool_proxy"
import {poll} from "@bokehjs/core/util/defer"

async function test(name: string) {
  const response = await fetch(`/cases/${name}`)
  const text = await response.text()
  const doc_json = json5.parse<DocJson>(text)
  doc_json.version = version // can't include version field in test cases; prevent spurious warnings
  const doc = Document.from_json(doc_json)
  return await display(doc, null)
}

describe("Bug", () => {
  describe("in issue #11694", () => {
    it.no_image("doesn't allow 'id' key in mappings and confuses them with refs", async () => {
      await test("regressions/issue_11694.json5")
    })
  })

  describe("in issue #11930", () => {
    it("doesn't allow overriding int major axis labels with floats", async () => {
      await test("regressions/issue_11930.json5")
    })
  })

  describe("in issue #13134", () => {
    it.no_image("doesn't allow using ndarrays in IndexFilter.indices", async () => {
      await test("regressions/issue_13134.json5")
    })
  })

  describe("in issue #13660", () => {
    it.no_image("doesn't allow using ndarrays in BooleanFilter.booleans", async () => {
      await test("regressions/issue_13660.json5")
    })
  })

  describe("in issue #13637", () => {
    it("doesn't allow using dict-based pseudo structs in model APIs", async () => {
      await test("regressions/issue_13637.json5")
    })

    it.no_image("doesn't allow deserialization of an empty dict as an empty Map", async () => {
      await test("regressions/issue_13637_empty_map.json5")
    })
  })

  describe("in issue #8766", () => {
    it("doesn't allow activation of proxied box zoom tools", async () => {
      const {views} = await test("regressions/issue_8766.json5")

      const [gp] = views
      expect_instanceof(gp, GridPlotView)
      const gb = gp.grid_box_view

      for (const pv of gb.child_views) {
        expect_instanceof(pv, PlotView)

        await actions(pv).pan(xy(0.5, 0.5), xy(1.5, 1.5))
        await pv.ready

        const [gr] = pv.model.renderers.filter((r) => r instanceof GlyphRenderer)
        expect(gr.data_source.selected.indices).to.be.equal([1])
      }
    })
  })

  describe("in issue #13964", () => {
    it.no_image("doesn't allow using 'constructor' key in maps or plain objects in may have refs contexts", async () => {
      await test("regressions/issue_13964.json5")
    })
  })

  describe("in issue #15070", () => {
    it.no_image("doesn't allow js_on_change('active', ...) on a tool", async () => {
      const {views} = await test("regressions/issue_15070.json5")

      const [pv] = views
      expect_instanceof(pv, PlotView)

      const [pan] = pv.model.toolbar.tools.filter((tool) => tool instanceof PanTool)
      const [box_zoom] = pv.model.toolbar.tools.filter((tool) => tool instanceof BoxZoomTool)

      // Tool.active is honored at construction, not only via Toolbar.active_drag,
      // and box_zoom's "auto" resolved to a concrete false
      expect(pan.active).to.be.true
      expect(box_zoom.active).to.be.false

      // resolving "auto" happens in Toolbar.initialize(), before connect_signals(),
      // so it must not have fired the user's callbacks
      expect(pan.tags).to.be.equal([])
      expect(box_zoom.tags).to.be.equal([])

      // and the callbacks are connected, i.e. they were serialized as "change:active".
      // CustomJS compiles its module lazily, so the callbacks resolve asynchronously.
      box_zoom.active = true
      await poll(() => pan.tags.length != 0 && box_zoom.tags.length != 0)
      expect(pan.tags).to.be.equal([false])
      expect(box_zoom.tags).to.be.equal([true])
    })

    it.no_image("resolves a proxied tool's 'auto' and honors the opt-out on drag", async () => {
      const {views} = await test("regressions/issue_15070_proxy.json5")

      const [gp] = views
      expect_instanceof(gp, GridPlotView)

      const proxies = gp.model.toolbar.tools.filter((tool) => tool instanceof ToolProxy)
      const tools = proxies.flatMap((proxy) => proxy.tools)
      const pans = tools.filter((tool) => tool instanceof PanTool)
      const box_zooms = tools.filter((tool) => tool instanceof BoxZoomTool)
      expect(pans.length).to.be.equal(3)
      expect(box_zooms.length).to.be.equal(3)

      // "auto" must be resolved on the tools the child plots own, and the
      // grid plot's toolbar must not reach through its proxies to undo that
      for (const tool of pans) {
        expect(tool.active).to.be.false
      }
      for (const tool of box_zooms) {
        expect(tool.active).to.be.true
      }

      // and the opt-out has to hold for a real drag: box zoom wins the gesture,
      // so dragging over part of the plot zooms in instead of panning
      for (const pv of gp.grid_box_view.child_views) {
        expect_instanceof(pv, PlotView)

        const {start, end} = pv.model.x_range
        await actions(pv).pan(xy(0.5, 0.5), xy(1.5, 1.5))
        await pv.ready

        expect(pv.model.x_range.start).to.not.be.equal(start)
        expect(pv.model.x_range.end).to.not.be.equal(end)
        expect(pv.model.x_range.end - pv.model.x_range.start).to.be.below(end - start)
      }
    })
  })
})
