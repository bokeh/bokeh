import {display, fig} from "../_util"
import {actions, xy} from "../../interactive"

import {CrosshairTool} from "@bokehjs/models/tools/inspectors/crosshair_tool"

describe("CrosshairTool", () => {
  describe("with dimensions='both'", () => {
    async function mkplot() {
      const crosshair = new CrosshairTool({overlay: "auto", dimensions: "both"})
      const p = fig([200, 200], {tools: [crosshair]})
      p.scatter([1, 2, 3], [1, 2, 3], {size: 20})
      return await display(p)
    }

    it("should show two spans when hovering over the frame", async () => {
      const {view} = await mkplot()
      await actions(view).hover(xy(2, 2))
    })

    it("should show one span when hovering over x-axis", async () => {
      const {view} = await mkplot()
      await actions(view, {units: {y: "screen"}}).hover(xy(2, 190))
    })

    it("should show one span when hovering over y-axis", async () => {
      const {view} = await mkplot()
      await actions(view, {units: {x: "screen"}}).hover(xy(10, 2))
    })
  })
})
