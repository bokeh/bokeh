import {PlotActionTool, PlotActionToolView} from "./plot_action_tool"
import type {IconLike} from "../../common/kinds"
import {Float} from "core/kinds"
import {PanDirection} from "core/enums"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"

export class ClickPanToolView extends PlotActionToolView {
  declare model: ClickPanTool

  doit(): void {
    const {direction, factor} = this.model
    this.plot_view.pan_by(direction, factor)
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

  override get computed_icon(): IconLike {
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
