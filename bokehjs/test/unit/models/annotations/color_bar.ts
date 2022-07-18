import {expect} from "assertions"

import {ColorBar, LinearColorMapper} from "@bokehjs/models"
import {Spectral10} from "@bokehjs/api/palettes"

describe("ColorBar", () => {

  describe("display cutoffs", () => {

    it("should be null by default", () => {
      const palette = Spectral10
      const color_mapper = new LinearColorMapper({palette})
      const color_bar = new ColorBar({color_mapper})

      expect(color_bar.display_low).to.be.null
      expect(color_bar.display_high).to.be.null
    })
  })
})
