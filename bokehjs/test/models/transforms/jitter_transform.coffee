{expect} = require "chai"
utils = require "../../utils"

{Collections} = utils.require "base"
Jitter = utils.require("models/transforms/jitter_transform").Model

describe "step_interpolator_transform module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_jitter = ->
    new Jitter({
      width: 1,
      center: 0,
      distribution: 'uniform'
    })

  describe "Jitter with uniform", ->
    transform = generate_jitter()
    transform.set('distribution', 'uniform')

    it "should average the fixed values", ->
      N = 1000
      vals =  Array.apply(null, Array(N)).map ->
                5
      rets = transform.v_compute(vals)

      add(a, b) ->
        return a+b

      thesum = rets.reduce(add, 0)
      thediff = (thesum/N) - 5
      expect(thediff).to.be.below 0.01


  describe "Jitter with normal", ->
    transform = generate_jitter()
    transform.set('distribution', 'normal')

    it "should average the fixed values", ->
      N = 1000
      vals =  Array.apply(null, Array(N)).map ->
                5
      rets = transform.v_compute(vals)

      add(a, b) ->
        return a+b

      thesum = rets.reduce(add, 0)
      thediff = (thesum/N) - 5
      expect(thediff).to.be.below 0.01
