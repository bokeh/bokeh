{expect} = require "chai"
utils = require "../../utils"

{LogTicker} = utils.require("models/tickers/log_ticker")

describe "LogTicker Model", ->

  describe "LogTicker get_ticks_no_defaults method", ->

    # not finite range

    it "should return empty ticks when start/end is not finite", ->
      ticker = new LogTicker()
      ticks = ticker.get_ticks_no_defaults(NaN, NaN, null, 3)
      expect(ticks.major).to.be.deep.equal([ ])
      expect(ticks.minor).to.be.deep.equal([ ])

    it "should return empty ticks when log(start) or log(end) not finite", ->
      ticker = new LogTicker()
      ticks = ticker.get_ticks_no_defaults(0, 100, null, 3)
      expect(ticks.major).to.be.deep.equal([ ])
      expect(ticks.minor).to.be.deep.equal([ ])

    # short range (<2 base orders)

    it "should have three major ticks and zero minor ticks for short range", ->
      ticker = new LogTicker({desired_num_ticks: 3, num_minor_ticks: 0})
      ticks = ticker.get_ticks_no_defaults(1, 999, null, 3)
      expect(ticks.major).to.be.deep.equal([ 1, 10, 100 ])
      expect(ticks.minor).to.be.deep.equal([ ])

    it "should have three major ticks and five minor ticks for short range", ->
      ticker = new LogTicker({desired_num_ticks: 3, num_minor_ticks: 1})
      ticks = ticker.get_ticks_no_defaults(1, 999, null, 3)
      expect(ticks.major).to.be.deep.equal([ 1, 10, 100 ])
      expect(ticks.minor).to.be.deep.equal([ 0.1, 1, 10, 100, 1000 ])

    it "should have three major ticks and nine minor ticks for short range", ->
      ticker = new LogTicker({desired_num_ticks: 3, num_minor_ticks: 2})
      ticks = ticker.get_ticks_no_defaults(1, 999, null, 3)
      expect(ticks.major).to.be.deep.equal([ 1, 10, 100 ])
      # 0.2 is weird, should be 0.5 i think
      expect(ticks.minor).to.be.deep.equal([ 0.2, 0.1, 1, 5, 10, 50, 100, 500, 1000 ])

    # long range (>=2 base orders)

    it "should have four major ticks and zero minor ticks for long range", ->
      ticker = new LogTicker({num_minor_ticks: 0})
      ticks = ticker.get_ticks_no_defaults(1, 1000, null, 4)
      expect(ticks.major).to.be.deep.equal([ 1e0, 1e1, 1e2, 1e3 ])
      expect(ticks.minor).to.be.deep.equal([ ])

    it "should have four major ticks and six minor ticks for long range", ->
      ticker = new LogTicker({num_minor_ticks: 1})
      ticks = ticker.get_ticks_no_defaults(1, 1000, null, 4)
      expect(ticks.major).to.be.deep.equal([ 1e0, 1e1, 1e2, 1e3 ])
      expect(ticks.minor).to.be.deep.equal([ 1e-1, 1e0, 1e1, 1e2, 1e3, 1e4 ])

    it "should have four major ticks and ten minor ticks for long range", ->
      ticker = new LogTicker({num_minor_ticks: 2})
      ticks = ticker.get_ticks_no_defaults(1, 1000, null, 4)
      expect(ticks.major).to.be.deep.equal([ 1e0, 1e1, 1e2, 1e3 ])
      # 0.2 is weird, should be 0.5 i think
      expect(ticks.minor).to.be.deep.equal([ 0.2, 1e-1, 1e0, 5e0, 1e1, 5e1, 1e2, 5e2, 1e3, 5e3, 1e4 ])
