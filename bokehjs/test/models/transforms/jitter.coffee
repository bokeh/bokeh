{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{FactorRange} = utils.require("models/ranges/factor_range")
{Jitter} = utils.require("models/transforms/jitter")
bokeh_math  = utils.require("core/util/math")

describe "Jitter transform module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_jitter = ->
    new Jitter({
      width: 1,
      mean: 0,
      distribution: 'uniform'
    })

  before ->
    sinon.stub(bokeh_math, "random", () -> return 0.5)
    # This menas that rnorm isn't getting tested, which we probably
    # do want to do, but could be a separate test.
    sinon.stub(bokeh_math, "rnorm", () -> return 0)

  after ->
    bokeh_math.random.restore()
    bokeh_math.rnorm.restore()

  describe "Jitter with uniform", ->
    transform = generate_jitter()
    transform.distribution = 'uniform'

    it "should average the fixed values", ->
      N = 100
      vals =  Array.apply(null, Array(N)).map ->
                5
      rets = transform.v_compute(vals)

      thesum = rets.reduce((a,b) ->
        return a+b
      , 0)
      thediff = (thesum/N) - 5
      # We can set this deterministically because we've stubbed random
      expect(thediff).to.equal 0

  describe "Jitter with normal", ->
    transform = generate_jitter()
    transform.distribution = 'normal'

    it "should average the fixed values", ->
      N = 100
      vals =  Array.apply(null, Array(N)).map ->
                5
      rets = transform.v_compute(vals)

      thesum = rets.reduce((a,b) ->
        return a+b
      , 0)
      thediff = (thesum/N) - 5
      # We can set this deterministically because we've stubbed rnorm
      expect(thediff).to.equal 0

  describe "Jitter with FactorRange", ->
    transform = generate_jitter()
    transform.distribution = 'uniform'
    transform.range = new FactorRange({factors: ["a", "b"]})

    it "should work with a supplied range", ->

      N = 100
      vals =  Array.apply(null, Array(N)).map ->
                "b"
      rets = transform.v_compute(vals)

      thesum = rets.reduce((a,b) ->
        return a+b
      , 0)
      thediff = (thesum/N) - 1.5 # relies on standard synthetic mapping
      # We can set this deterministically because we've stubbed random
      expect(thediff).to.equal 0
