{expect} = require "chai"
utils = require "../utils"

mixins = utils.require "core/property_mixins"

describe "property_mixins module", ->

  describe "exports", ->

    it "should have mixins", ->
      expect("line" of mixins).to.be.true
      expect("fill" of mixins).to.be.true
      expect("text" of mixins).to.be.true

    it "should have a create function", ->
       expect("create" of mixins).to.be.true
