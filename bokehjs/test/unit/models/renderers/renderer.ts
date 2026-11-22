import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {Renderer, RendererView} from "@bokehjs/models/renderers/renderer"
import {BoxAnnotation} from "@bokehjs/models/annotations/box_annotation"
import {bounding_box} from "@bokehjs/core/dom"

class SomeRendererView extends RendererView {
  declare model: SomeRenderer

  protected _paint(): void {}
}

class SomeRenderer extends Renderer {}

describe("RendererView", () => {

  describe("needs_clip", () => {

    it("should return false", () => {
      const r = SomeRenderer.create()
      const rv = new SomeRendererView({model: r, parent: null})
      expect(rv.needs_clip).to.be.false
    })
  })

  describe("update_position()", () => {

    it("should place the element at the renderer's bbox", async () => {
      const p = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})
      const glyph_renderer = p.scatter({x: [2, 8], y: [3, 7], size: 10})
      const box_annotation = BoxAnnotation.create({left: 1, right: 4, bottom: 2, top: 6})
      p.add_layout(box_annotation)
      const {view} = await display(p)

      // these renderers are rendered into the frame's element, which isn't at the canvas' origin
      expect(view.frame.bbox.x).to.be.above(0)

      const canvas_bbox = bounding_box(view.canvas_view.el)
      for (const renderer of [glyph_renderer, box_annotation]) {
        const rv = view.owner.get_one(renderer)
        const actual = bounding_box(rv.el).relative_to(canvas_bbox)
        const expected = rv.bbox
        expect(actual.x).to.be.similar(expected.x, 0.5)
        expect(actual.y).to.be.similar(expected.y, 0.5)
        expect(actual.width).to.be.similar(expected.width, 0.5)
        expect(actual.height).to.be.similar(expected.height, 0.5)
      }
    })
  })
})
