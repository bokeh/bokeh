import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {TextView} from "@bokehjs/models/glyphs/text"
import type {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import type {GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Selection} from "@bokehjs/models/selections/selection"
import {bounding_box} from "@bokehjs/core/dom"
import {BBox} from "@bokehjs/core/util/bbox"
import {PI} from "@bokehjs/core/util/math"

const {min, max} = Math

describe("Text glyph", () => {
  describe("should mirror canvas labels with DOM text nodes", () => {
    async function setup(attrs: {angle?: number} = {}): Promise<{view: PlotView, renderer: GlyphRenderer, renderer_view: GlyphRendererView}> {
      const p = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})
      const renderer = p.text({
        x: [1, 5, 9], y: [1, 5, 9], text: ["first", "second\nline", "third"],
        text_font_size: "20px", padding: 5, ...attrs,
      })
      const {view} = await display(p)
      const renderer_view = view.owner.get_one(renderer)
      return {view, renderer, renderer_view}
    }

    function text_view(renderer_view: GlyphRendererView): TextView {
      const {glyph} = renderer_view
      if (!(glyph instanceof TextView)) {
        throw new Error("expected TextView")
      }
      return glyph
    }

    function label_els(renderer_view: GlyphRendererView): HTMLElement[] {
      const glyph_view = text_view(renderer_view)
      if (!glyph_view.el.isConnected) {
        return []
      }
      return [...glyph_view.shadow_el.children].filter((el) => el instanceof HTMLDivElement)
    }

    function texts(renderer_view: GlyphRendererView): string[] {
      return label_els(renderer_view).map((el) => el.textContent)
    }

    it("with one node per label, in index order", async () => {
      const {renderer_view} = await setup()
      expect(texts(renderer_view)).to.be.equal(["first", "second\nline", "third"])
    })

    it("with transparent and non-interactive text", async () => {
      const {renderer_view} = await setup()
      const [el] = label_els(renderer_view)
      const style = getComputedStyle(el)
      expect(style.color).to.be.equal("rgba(0, 0, 0, 0)")
      expect(style.pointerEvents).to.be.equal("none")
      expect(style.visibility).to.be.equal("visible")
    })

    for (const angle of [0, PI/6]) {
      it(`with nodes covering canvas label boxes when angle=${angle}`, async () => {
        const {view, renderer_view} = await setup({angle})
        const glyph_view = text_view(renderer_view)
        const canvas_bbox = bounding_box(view.canvas_view.el)

        for (const [el, i] of label_els(renderer_view).map((el, i) => [el, i] as const)) {
          const {p0, p1, p2, p3} = glyph_view.rect_i(i)
          const xs = [p0.x, p1.x, p2.x, p3.x]
          const ys = [p0.y, p1.y, p2.y, p3.y]
          const expected = BBox.from_lrtb({
            left: min(...xs), right: max(...xs),
            top: min(...ys), bottom: max(...ys),
          })
          const actual = bounding_box(el).relative_to(canvas_bbox)
          expect(actual.left).to.be.similar(expected.left, 0.5)
          expect(actual.top).to.be.similar(expected.top, 0.5)
          expect(actual.width).to.be.similar(expected.width, 0.5)
          expect(actual.height).to.be.similar(expected.height, 0.5)
        }
      })
    }

    it("without duplicating nodes when a selection is present", async () => {
      const {view, renderer, renderer_view} = await setup()
      renderer.data_source.selected = Selection.create({indices: [1]})
      await view.ready
      expect(texts(renderer_view)).to.be.equal(["first", "second\nline", "third"])
    })

    it("that follow data updates and skip null text", async () => {
      const {view, renderer, renderer_view} = await setup()
      renderer.data_source.data = {x: [2, 3], y: [2, 3], text: ["a", null]}
      await view.ready
      expect(texts(renderer_view)).to.be.equal(["a"])
    })

    it("that exclude labels outside the frame", async () => {
      const {view, renderer_view} = await setup()
      view.model.x_range.setv({start: 3, end: 7})
      view.model.y_range.setv({start: 3, end: 7})
      await view.ready
      expect(texts(renderer_view)).to.be.equal(["second\nline"])
    })

    it("that are removed when the renderer is hidden and restored when shown", async () => {
      const {view, renderer, renderer_view} = await setup()
      renderer.visible = false
      await view.ready
      expect(texts(renderer_view)).to.be.equal([])

      renderer.visible = true
      await view.ready
      expect(texts(renderer_view)).to.be.equal(["first", "second\nline", "third"])
    })

    it("in the glyph's element, attached to the renderer's element", async () => {
      const {renderer_view} = await setup()
      const glyph_view = text_view(renderer_view)
      expect(glyph_view.el.parentNode).to.be.equal(renderer_view.shadow_el)
      expect(glyph_view.el.classList.contains("bk-Text")).to.be.true
    })

    it("that are removed when the renderer is removed", async () => {
      const {view, renderer, renderer_view} = await setup()
      const glyph_view = text_view(renderer_view)
      view.model.renderers = view.model.renderers.filter((r) => r != renderer)
      await view.ready
      expect(glyph_view.el.isConnected).to.be.false
    })
  })
})
