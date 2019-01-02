import {expect} from "chai"

import {Renderer, RendererView} from "models/renderers/renderer"

class SomeRendererView extends RendererView {
  model: SomeRenderer
}

class SomeRenderer extends Renderer {}

describe("RendererView", () => {

  describe("needs_clip", () => {

    it("should return false", () => {
      const r = new SomeRenderer()
      const rv = new SomeRendererView({model: r, parent: null})
      expect(rv.needs_clip).to.be.equal(false)
    })
  })
})
