import {expect} from "#framework/assertions"

import {ColorBar, LinearColorMapper} from "@bokehjs/models"
import {Spectral10} from "@bokehjs/api/palettes"

describe("ColorBar", () => {

  describe("display cutoffs", () => {

    it("should be null by default", () => {
      const palette = Spectral10
      const color_mapper = LinearColorMapper.create({palette})
      const color_bar = ColorBar.create({color_mapper})

      expect(color_bar.display_low).to.be.null
      expect(color_bar.display_high).to.be.null
    })
  })
})
