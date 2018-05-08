{expect} = require "chai"

{compute_side} = require("models/annotations/tooltip")


describe "compute_side", ->

  for side in ["left", "right", "above", "below"]
    it "should return explicit #{side} attachment as-is", ->
      expect(compute_side(side), 0,   0, 5, 5).to.be.equal side
      expect(compute_side(side), 10,  0, 5, 5).to.be.equal side
      expect(compute_side(side), 0,  10, 5, 5).to.be.equal side
      expect(compute_side(side), 10, 10, 5, 5).to.be.equal side

  it "should return vertical attachment based on sy and vcenter", ->
      # top of screen, attach below
      expect(compute_side("vertical", 0,   0, 5, 5)).to.be.equal "below"
      expect(compute_side("vertical", 10,  0, 5, 5)).to.be.equal "below"

      # bottom of screen, attach above
      expect(compute_side("vertical", 0,  10, 5, 5)).to.be.equal "above"
      expect(compute_side("vertical", 10, 10, 5, 5)).to.be.equal "above"

  it "should return horizontal attachment based on sx and hcenter", ->
      # left of screen, attach right
      expect(compute_side("horizontal", 0,   0, 5, 5)).to.be.equal "right"
      expect(compute_side("horizontal", 0,  10, 5, 5)).to.be.equal "right"

      # right of screen, attach left
      expect(compute_side("horizontal", 10,  0, 5, 5)).to.be.equal "left"
      expect(compute_side("horizontal", 10, 10, 5, 5)).to.be.equal "left"
