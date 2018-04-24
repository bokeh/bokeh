{expect} = require "chai"
utils = require "../../utils"

{Renderer, RendererView} = utils.require("models/renderers/renderer")

describe "RendererView", ->

  describe "needs_clip", ->

    it "should return false", ->
      r = new Renderer()
      rv = new RendererView({model: r, parent: null})
      expect(rv.needs_clip).to.be.equal false
