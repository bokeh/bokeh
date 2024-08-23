import {PlotActionTool, PlotActionToolView} from "./plot_action_tool"
import {Float} from "core/kinds"
import {PanDirection} from "core/enums"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"
import {update_ranges} from "../gestures/pan_tool"

export class ClickPanToolView extends PlotActionToolView {
  declare model: ClickPanTool

  doit(): void {
    const direction = (() => {
      switch (this.model.direction) {
        case "left":
        case "west":
          return {x: -1, y: 0}
        case "right":
        case "east":
          return {x: +1, y: 0}
        case "up":
        case "north":
          return {x: 0, y: -1}
        case "down":
        case "south":
          return {x: 0, y: +1}
      }
    })()

    const {frame} = this.plot_view
    const {factor} = this.model

    const x_offset = direction.x*factor*frame.bbox.width
    const y_offset = direction.y*factor*frame.bbox.height

    const bbox = frame.bbox.translate(x_offset, y_offset)

    const xrs = update_ranges(frame.x_scales, bbox.x0, bbox.x1)
    const yrs = update_ranges(frame.y_scales, bbox.y0, bbox.y1)
    this.plot_view.update_range({xrs, yrs}, {panning: true})
  }
}

export namespace ClickPanTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PlotActionTool.Props & {
    direction: p.Property<PanDirection>
    factor: p.Property<number>
  }
}

export interface ClickPanTool extends ClickPanTool.Attrs {}

export class ClickPanTool extends PlotActionTool {
  declare properties: ClickPanTool.Props
  declare __view_type__: ClickPanToolView

  constructor(attrs?: Partial<ClickPanTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ClickPanToolView

    this.define<ClickPanTool.Props>(() => ({
      direction: [ PanDirection ],
      factor: [ Float, 0.1 ],
    }))

    this.register_alias("pan_left", () => new ClickPanTool({direction: "left"}))
    this.register_alias("pan_right", () => new ClickPanTool({direction: "right"}))
    this.register_alias("pan_up", () => new ClickPanTool({direction: "up"}))
    this.register_alias("pan_down", () => new ClickPanTool({direction: "down"}))

    this.register_alias("pan_west", () => new ClickPanTool({direction: "west"}))
    this.register_alias("pan_east", () => new ClickPanTool({direction: "east"}))
    this.register_alias("pan_north", () => new ClickPanTool({direction: "north"}))
    this.register_alias("pan_south", () => new ClickPanTool({direction: "south"}))
  }

  override tool_name = "Click Pan"

  override get tooltip(): string {
    return `Pan ${this.direction}`
  }

  override get computed_icon(): string {
    const icon = super.computed_icon
    if (icon != null) {
      return icon
    } else {
      switch (this.direction) {
        case "left":
        case "west":
          return `.${icons.tool_icon_pan_left}`
        case "right":
        case "east":
          return `.${icons.tool_icon_pan_right}`
        case "up":
        case "north":
          return `.${icons.tool_icon_pan_up}`
        case "down":
        case "south":
          return `.${icons.tool_icon_pan_down}`
      }
    }
  }
}
