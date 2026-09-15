import {display, fig} from "#framework/layouts"
import {PlotActions, xy} from "#framework/interactive"

import type {BoxLikeGlyph} from "@bokehjs/models/tools/edit/box_edit_tool"
import {BoxEditTool} from "@bokehjs/models/tools/edit/box_edit_tool"
import type {GlyphRenderer} from "@bokehjs/models"
import type {Figure} from "@bokehjs/api/figure"
import {paint} from "@bokehjs/core/util/defer"

describe("BoxEditTool", () => {
  describe("should support moving", () => {
    async function move<T extends BoxLikeGlyph>(glyph: (p: Figure) => GlyphRenderer<T>, height: number = 200) {
      const box_edit = new BoxEditTool()
      const p = fig([200, height], {
        x_range: [-1, 2],
        y_range: [-1, 2],
        toolbar_location: null,
        tools: [box_edit],
        active_drag: box_edit,
      })

      const r = glyph(p)
      box_edit.renderers.push(r)

      const {view} = await display(p)
      const actions = new PlotActions(view)
      await actions.pan(xy(0.25, 0.25), xy(1.25, 1.25), 2)
      await paint()
    }

    it("Rect glyph", async () => {
      await move((p) => p.rect({x: [0], y: [0], width: [1], height: [1]}))
    })

    it("Block glyph", async () => {
      await move((p) => p.block({x: [0], y: [0], width: [1], height: [1]}))
    })

    it("Quad glyph", async () => {
      await move((p) => p.quad({left: [0], right: [1], top: [1], bottom: [0]}))
    })

    it("HBar glyph", async () => {
      // A 201px plot has a 174px frame, so this 3-unit y-range maps height=1
      // to exactly 58px and avoids platform-dependent bounding-box rounding.
      await move((p) => p.hbar({y: [0], height: [1], left: [0], right: [1]}), 201)
    })

    it("VBar glyph", async () => {
      await move((p) => p.vbar({x: [0], width: [1], top: [1], bottom: [0]}))
    })

    it("HStrip glyph", async () => {
      await move((p) => p.hstrip({y0: [0], y1: [1]}))
    })

    it("VStrip glyph", async () => {
      await move((p) => p.vstrip({x0: [0], x1: [1]}))
    })
  })
})
