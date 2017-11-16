import {expect} from "chai"

import {MercatorTicker} from "models/tickers/mercator_ticker"

describe("MercatorTicker Model", () => {

  describe("get_ticks_no_defaults method", () => {

    it("should clip longitude ticks outside projection bounds", () => {
      const ticker = new MercatorTicker({dimension: 'lon'})
      const ticks = ticker.get_ticks_no_defaults(-20036376, 10018754, -20048966.10, 3)
      expect(ticks.major).to.deep.equal([-11131949.079327356, 0])
    })

    it("should clip latitude ticks outside projection bounds", () => {
      const ticker = new MercatorTicker({dimension: 'lat'})
      const ticks = ticker.get_ticks_no_defaults(-20058966, 5621521, -20026376.39, 3)
      expect(ticks.major).to.deep.equal([-6446275.841017161, -7.081154551613622e-10])
    })

    it("should not clip longitude ticks inside projection bounds", () => {
      const ticker = new MercatorTicker({dimension: 'lon'})
      const ticks = ticker.get_ticks_no_defaults(-10018754, 10018754, -20048966.10, 3)
      expect(ticks.major).to.deep.equal([-5565974.539663678, 0, 5565974.539663678])
    })

    it("should not clip latitude ticks inside projection bounds", () => {
      const ticker = new MercatorTicker({dimension: 'lat'})
      const ticks = ticker.get_ticks_no_defaults(-5621521, 5621521, -20026376.39, 3)
      expect(ticks.major).to.deep.equal([-7.081154551613622e-10])
    })
  })
})
