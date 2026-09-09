import {expect} from "#framework/assertions"

import {Renderer, RendererView} from "@bokehjs/models/renderers/renderer"

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
})
