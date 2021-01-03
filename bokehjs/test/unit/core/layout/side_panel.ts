import {expect} from "assertions"

import {Panel} from "@bokehjs/core/layout/side_panel"

describe("Panel", () => {

  describe("apply_location_heuristics", () => {

    it("should calculate appropriate axis_label text properties based on location", () => {
      const p1 = new Panel("left")
      const ctx1 = {} as any
      p1.apply_label_text_heuristics(ctx1, "parallel")
      expect(ctx1.textBaseline).to.be.equal("alphabetic")
      expect(ctx1.textAlign).to.be.equal("center")

      const p2 = new Panel("below")
      const ctx2 = {} as any
      p2.apply_label_text_heuristics(ctx2, Math.PI/2)
      expect(ctx2.textBaseline).to.be.equal("middle")
      expect(ctx2.textAlign).to.be.equal("right")
    })
  })

  describe("get_label_angle_heuristic", () => {

    it("should calculate appropriate axis_label angle rotation based on location", () => {
      const p1 = new Panel("left")
      const angle1 = p1.get_label_angle_heuristic("parallel")
      expect(angle1).to.be.equal(-Math.PI/2)

      const p2 = new Panel("below")
      const angle2 = p2.get_label_angle_heuristic("horizontal")
      expect(angle2).to.be.equal(0)
    })
  })
})
