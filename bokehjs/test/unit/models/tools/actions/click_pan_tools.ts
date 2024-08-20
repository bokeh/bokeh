import {expect} from "assertions"
import {display} from "../../../_util"

import {ClickPanTool} from "@bokehjs/models/tools/actions/click_pan_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot} from "@bokehjs/models/plots/plot"
import type {PanDirection} from "@bokehjs/core/enums"

describe("ClickPanTool", () => {

  async function mkplot(direction: PanDirection) {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    const tool = new ClickPanTool({direction, factor: 0.2})
    plot.add_tools(tool)
    const {view: plot_view} = await display(plot)
    const tool_view = plot_view.owner.get_one(tool)
    return {plot_view, tool_view}
  }

  it("should translate x-range left", async () => {
    const {plot_view, tool_view} = await mkplot("left")
    const {x_range, y_range} = plot_view.frame

    tool_view.doit()
    expect(x_range.interval).to.be.similar([-0.2, 0.8])
    expect(y_range.interval).to.be.similar([ 0.0, 1.0])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([-0.4, 0.6])
    expect(y_range.interval).to.be.similar([ 0.0, 1.0])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([-0.6, 0.4])
    expect(y_range.interval).to.be.similar([ 0.0, 1.0])
  })

  it("should translate x-range right", async () => {
    const {plot_view, tool_view} = await mkplot("right")
    const {x_range, y_range} = plot_view.frame

    tool_view.doit()
    expect(x_range.interval).to.be.similar([0.2, 1.2])
    expect(y_range.interval).to.be.similar([0.0, 1.0])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([0.4, 1.4])
    expect(y_range.interval).to.be.similar([0.0, 1.0])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([0.6, 1.6])
    expect(y_range.interval).to.be.similar([0.0, 1.0])
  })

  it("should translate y-range up", async () => {
    const {plot_view, tool_view} = await mkplot("up")
    const {x_range, y_range} = plot_view.frame

    tool_view.doit()
    expect(x_range.interval).to.be.similar([0.0, 1.0])
    expect(y_range.interval).to.be.similar([0.2, 1.2])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([0.0, 1.0])
    expect(y_range.interval).to.be.similar([0.4, 1.4])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([0.0, 1.0])
    expect(y_range.interval).to.be.similar([0.6, 1.6])
  })

  it("should translate y-range down", async () => {
    const {plot_view, tool_view} = await mkplot("down")
    const {x_range, y_range} = plot_view.frame

    tool_view.doit()
    expect(x_range.interval).to.be.similar([ 0.0, 1.0])
    expect(y_range.interval).to.be.similar([-0.2, 0.8])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([ 0.0, 1.0])
    expect(y_range.interval).to.be.similar([-0.4, 0.6])

    tool_view.doit()
    expect(x_range.interval).to.be.similar([ 0.0, 1.0])
    expect(y_range.interval).to.be.similar([-0.6, 0.4])
  })
})
