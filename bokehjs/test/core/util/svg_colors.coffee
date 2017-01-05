{expect} = require "chai"
utils = require "../../utils"

svg_colors = utils.require "core/util/svg_colors"

describe "svg_color module", ->

  it "should have size = 147", ->
      expect(Object.keys(svg_colors).length).to.be.equal 147
