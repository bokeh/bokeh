import {expect} from "assertions"

import {MercatorTickFormatter} from "@bokehjs/models/formatters/mercator_tick_formatter"
import {wgs84_mercator} from "@bokehjs/core/util/projections"

describe("mercator_tick_formatter module", () => {

  it("should throw exception if dimension not configured", () => {
    const obj = new MercatorTickFormatter()
    expect(() => obj.doFormat([30, 60, 90], {loc: 90})).to.throw()
  })

  // these tests assume default superclass BasicTickFormatter behavior, re: displayed precision

  it("should compute latitude tick labels when dimension=lat", () => {
    const obj = new MercatorTickFormatter({dimension: 'lat'})
    for (const lat of [-72, -60.5, -30, -2, 1, -0.5, 0, 0.5, 1, 10, 33.7, 42.123, 50]) {
      for (const lon of [-120, -90, -88, -32.7, -10, -1, 0, 0.5, 1, 5, 12.3, 57, 60.123, 95, 110.1, 120, 130]) {
        const [mlon, mlat] = wgs84_mercator.compute(lon, lat)
        const labels = obj.doFormat([mlat], {loc: mlon})
        expect(labels[0]).to.be.equal(`${lat}`)
      }
    }
  })

  it("should compute longitude tick labels when dimension=lon", () => {
    const obj = new MercatorTickFormatter({dimension: 'lon'})
    for (const lat of [-72, -60.5, -30, -2, 1, -0.5, 0, 0.5, 1, 10, 33.7, 42.123, 50]) {
      for (const lon of [-120, -90, -88, -32.7, -10, -1, 0, 0.5, 1, 5, 12.3, 57, 60.123, 95, 110.1, 120, 130]) {
        const [mlon, mlat] = wgs84_mercator.compute(lon, lat)
        const labels = obj.doFormat([mlon], {loc: mlat})
        expect(labels[0]).to.be.equal(`${lon}`)
      }
    }
  })
})
