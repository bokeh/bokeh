import {expect} from "assertions"

import {SidePanel} from "@bokehjs/core/layout/side_panel"

describe("Panel", () => {

  describe("apply_location_heuristics", () => {

    it("should calculate appropriate axis_label text properties based on location", () => {
      const panel0 = new SidePanel("left")
      const value0 = panel0.get_label_text_heuristics("parallel")
      expect(value0).to.be.equal({vertical_align: "bottom", align: "center"})

      const panel1 = new SidePanel("below")
      const value1 = panel1.get_label_text_heuristics(Math.PI/2)
      expect(value1).to.be.equal({vertical_align: "center", align: "right"})
    })
  })

  describe("get_label_angle_heuristic", () => {

    it("should calculate appropriate axis_label angle rotation based on location", () => {
      const panel0 = new SidePanel("left")
      const angle0 = panel0.get_label_angle_heuristic("parallel")
      expect(angle0).to.be.equal(-Math.PI/2)

      const panel1 = new SidePanel("below")
      const angle1 = panel1.get_label_angle_heuristic("horizontal")
      expect(angle1).to.be.equal(0)
    })
  })
})
