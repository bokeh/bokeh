{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

view_for = (model) ->
  new model.default_view({model : model})

describe "glyphs", ->
  describe "units handling", ->
    it "should default to 'data' for distances", ->
      obj = Collections('AnnularWedge').create()
      view = view_for(obj)
      expect(view.distances.inner_radius.units).to.be.equal 'data'

    it "should default to 'rad' for angles", ->
      obj = Collections('AnnularWedge').create()
      view = view_for(obj)
      expect(view.angles.start_angle.units).to.be.equal 'rad'

    it "should get the constructor-provided units for distances", ->
      obj = Collections('AnnularWedge').create({ 'inner_radius' : { 'value' : 1, 'units' : 'screen' } })
      view = view_for(obj)
      expect(view.distances.inner_radius.units).to.be.equal 'screen'

    it "should get the constructor-provided units for angles", ->
      obj = Collections('AnnularWedge').create({ 'start_angle' : { 'value' : 60, 'units' : 'deg' } })
      view = view_for(obj)
      expect(view.angles.start_angle.units).to.be.equal 'deg'

    it "should update units when a distance value is set", ->
      obj = Collections('AnnularWedge').create()
      view = view_for(obj)
      expect(view.distances.inner_radius.units).to.be.equal 'data'
      obj.set({ 'inner_radius' : { 'value' : 1, 'units' : 'screen' } })
      expect(view.distances.inner_radius.units).to.be.equal 'screen'

    it "should update units when an angle value is set", ->
      obj = Collections('AnnularWedge').create()
      view = view_for(obj)
      expect(view.angles.start_angle.units).to.be.equal 'rad'
      obj.set({ 'start_angle' : { 'value' : 60, 'units' : 'deg' } })
      expect(view.angles.start_angle.units).to.be.equal 'deg'
