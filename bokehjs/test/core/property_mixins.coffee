{expect} = require "chai"
utils = require "../utils"

mixins = utils.require "core/property_mixins"

describe "property_mixins module", ->

  describe "exports", ->

    it "should have context properties", ->
      expect("Line" of mixins).to.be.true
      expect("Fill" of mixins).to.be.true
      expect("Text" of mixins).to.be.true

    it "should have property factories", ->
      expect("coords" of mixins.factories).to.be.true
      expect("distances" of mixins.factories).to.be.true
      expect("angles" of mixins.factories).to.be.true
      expect("fields" of mixins.factories).to.be.true
      expect("visuals" of mixins.factories).to.be.true
