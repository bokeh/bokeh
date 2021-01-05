import {expect} from "assertions"

import {MercatorTickFormatter} from "@bokehjs/models/formatters/mercator_tick_formatter"
import {unicode_replace} from "@bokehjs/models/formatters/basic_tick_formatter"
import {wgs84_mercator} from "@bokehjs/core/util/projections"
import {build_view} from "@bokehjs/core/build_views"

describe("mercator_tick_formatter module", () => {

  // these tests assume default superclass BasicTickFormatter behavior, re: displayed precision

  it("should compute latitude tick labels when dimension=lat", async () => {
    const formatter = new MercatorTickFormatter()
    for (const lat of [-72, -60.5, -30, -2, 1, -0.5, 0, 0.5, 1, 10, 33.7, 42.123, 50]) {
      for (const lon of [-120, -90, -88, -32.7, -10, -1, 0, 0.5, 1, 5, 12.3, 57, 60.123, 95, 110.1, 120, 130]) {
        const [mlon, mlat] = wgs84_mercator.compute(lon, lat)
        const formatter_view = await build_view(formatter, {parent: {loc: mlon, dimension: 1}}) /* lat */
        const labels = formatter_view.compute(mlat)
        expect(labels).to.be.equal(unicode_replace(`${lat}`))
      }
    }
  })

  it("should compute longitude tick labels when dimension=lon", async () => {
    const formatter = new MercatorTickFormatter()
    for (const lat of [-72, -60.5, -30, -2, 1, -0.5, 0, 0.5, 1, 10, 33.7, 42.123, 50]) {
      for (const lon of [-120, -90, -88, -32.7, -10, -1, 0, 0.5, 1, 5, 12.3, 57, 60.123, 95, 110.1, 120, 130]) {
        const [mlon, mlat] = wgs84_mercator.compute(lon, lat)
        const formatter_view = await build_view(formatter, {parent: {loc: mlat, dimension: 0}}) /* lon */
        const labels = formatter_view.compute(mlon)
        expect(labels).to.be.equal(unicode_replace(`${lon}`))
      }
    }
  })
})
