{expect} = require "chai"

{MercatorTickFormatter} = require "models/formatters/mercator_tick_formatter"
{wgs84_mercator} = require "core/util/projections"

describe "mercator_tick_formatter module", ->

  it "should throw exception if dimension not configured", ->
    obj = new MercatorTickFormatter()
    expect(() -> obj.doFormat([30, 60, 90], 90)).to.throw Error

  # these tests assume default superclass BasicTickFormatter behavior, re: displayed precision

  it "should compute latitude tick labels when dimension=lat", ->
    obj = new MercatorTickFormatter({dimension: 'lat'})
    for lat in [-72, -60.5, -30, -2, 1, -0.5, 0, 0.5, 1, 10, 33.7, 42.123, 50]
      for lon in [-120, -90, -88, -32.7, -10, -1, 0, 0.5, 1, 5, 12.3, 57, 60.123, 95, 110.1, 120, 130]
        [mlon, mlat] = wgs84_mercator.forward([lon, lat])
        labels = obj.doFormat([mlat], mlon)
        expect(labels[0]).to.equal "#{lat}"

  it "should compute longitude tick labels when dimension=lon", ->
    obj = new MercatorTickFormatter({dimension: 'lon'})
    for lat in [-72, -60.5, -30, -2, 1, -0.5, 0, 0.5, 1, 10, 33.7, 42.123, 50]
      for lon in [-120, -90, -88, -32.7, -10, -1, 0, 0.5, 1, 5, 12.3, 57, 60.123, 95, 110.1, 120, 130]
        [mlon, mlat] = wgs84_mercator.forward([lon, lat])
        labels = obj.doFormat([mlon], mlat)
        expect(labels[0]).to.equal "#{lon}"
