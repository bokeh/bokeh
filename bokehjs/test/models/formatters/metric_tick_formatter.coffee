{expect} = require "chai"
utils = require "../../utils"

{MetricTickFormatter} = utils.require "models/formatters/metric_tick_formatter"

describe "metric_tick_formatter module", ->
  it "should prefix numbers appropriately", ->
    obj = new MetricTickFormatter()
    labels = obj.doFormat(
      [1e-15,1e-14,1e-13,1e-12,1e-1,1e0,1e1,1e2,1e15], null)
    expect(labels).to.deep.equal(
      ["1f","10f","100f","1p","100m","1","10","100","1P"])
  it "should unify prefixes", ->
    obj = new MetricTickFormatter()
    labels = obj.doFormat(
      [0, 0.5e3, 1e3, 1.5e3, 2e3], null)
    expect(labels).to.deep.equal(
      ["0k", "0.5k", "1k", "1.5k", "2k"])
  it "should handle large/small numbers", ->
    obj = new MetricTickFormatter()
    labels = obj.doFormat(
      [1e-80, 1e-40, 1, 1e40, 1e80], null)
    expect(labels).to.deep.equal(
      ["1e-80", "1e-40", "1", "1e40", "1e80"])
  it "should handle 0", ->
    obj = new MetricTickFormatter()
    labels = obj.doFormat(
      [0], null)
    expect(labels).to.deep.equal(
      ["0"])
  it "should respect max_precision", ->
    obj = new MetricTickFormatter({max_precision: 2})
    labels = obj.doFormat(
      [1.120, 1.121, 1.122, 1.123], null)
    expect(labels).to.deep.equal(
      ["1.12", "1.12", "1.12", "1.12"])
