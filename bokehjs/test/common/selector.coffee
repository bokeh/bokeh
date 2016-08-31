{expect} = require "chai"
utils = require "../utils"
fixtures = require "./fixtures/object"

base = utils.require "base"
Selector = utils.require "common/selector"
hittest = utils.require "common/hittest"

empty_selection = hittest.create_hit_test_result()

describe "Selector module", ->

  beforeEach ->
    @hit_indices_1 = hittest.create_hit_test_result()
    @hit_indices_1['1d'].indices = [0, 1, 2]

    @hit_indices_2 = hittest.create_hit_test_result()
    @hit_indices_2['1d'].indices = [7, 8, 9]

  describe "Selector initialization", ->

    it "should set `indices` attribute as empty HitTestResult", ->
      s = new Selector()
      expect(s.get('indices')).to.deep.equal empty_selection

  describe "Selector.update method", ->

    it "should reset the `indices` attributes if append arg is false", ->
      s = new Selector()

      # function signature is: update(indices, final, append)
      s.update(@hit_indices_1, false, false)
      expect(s.indices).to.be.deep.equal(@hit_indices_1)

      s.update(@hit_indices_2, false, false)
      expect(s.indices).to.be.deep.equal(@hit_indices_2)

    it "should union the `1d` indices if append arg is true", ->
      s = new Selector()

      # function signature is `Selector.update(indices, final, append)`
      s.update(@hit_indices_1, false, true)
      s.update(@hit_indices_2, false, true)
      expect(s.indices['1d'].indices).to.be.deep.equal([0,1,2,7,8,9])

      # also shouldn't mutate either indices arguments
      expect(@hit_indices_1['1d'].indices).to.be.deep.equal([0,1,2])
      expect(@hit_indices_2['1d'].indices).to.be.deep.equal([7,8,9])

    it "should concat the `2d` indices along key if append arg is true", ->
      s = new Selector()
      hit_indices_1 = hittest.create_hit_test_result()
      hit_indices_1['2d'] = {3: [5, 6], 4: [7]}
      hit_indices_2 = hittest.create_hit_test_result()
      hit_indices_2['2d'] = {2: [1, 2], 3: [3]}

      # function signature is `Selector.update(indices, final, append)`
      s.update(hit_indices_1, false, true)
      expect(s.indices['2d']).to.be.deep.equal( {3: [5, 6], 4: [7]} )

      s.update(hit_indices_2, false, true)
      expect(s.indices['2d']).to.be.deep.equal( {3: [3, 5, 6], 2: [1, 2], 4: [7]})

  describe "Selector.clear method", ->
    it "should set `indices` attribute as empty HitTestResult", ->
      s = new Selector()
      s.set('indices', @hit_indices_1)

      s.clear()
      expect(s.get('indices')).to.deep.equal empty_selection
