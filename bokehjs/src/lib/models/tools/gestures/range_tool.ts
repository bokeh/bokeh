import {Tool, ToolView} from "../tool"
import {OnOffButton} from "../on_off_button"
import type {PlotView} from "../../plots/plot"
import {BoxAnnotation} from "../../annotations/box_annotation"
import {Range} from "../../ranges/range"
import type {RangeState} from "../../plots/range_manager"
import {logger} from "core/logging"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import {isNumber, non_null} from "core/util/types"
import {tool_icon_range} from "styles/icons.css"
import {Node} from "../../coordinates/node"

export class RangeToolView extends ToolView {
  declare model: RangeTool
  declare readonly parent: PlotView

  override get overlays() {
    return [...super.overlays, this.model.overlay]
  }

  override initialize(): void {
    super.initialize()
    this.model.update_overlay_from_ranges()
  }

  override connect_signals(): void {
    super.connect_signals()

    const update_overlay = () => this.model.update_overlay_from_ranges()

    this.on_transitive_change(this.model.properties.x_range, update_overlay)
    this.on_transitive_change(this.model.properties.y_range, update_overlay)

    this.model.overlay.pan.connect(([state, _]) => {
      if (state == "pan") {
        this.model.update_ranges_from_overlay()
      } else if (state == "pan:end") {
        const ranges = [this.model.x_range, this.model.y_range].filter(non_null)
        this.parent.trigger_ranges_update_event(ranges)
      }
    })

    const {active, x_interaction, y_interaction} = this.model.properties
    this.on_change([active, x_interaction, y_interaction], () => {
      this.model.update_constraints()
    })
  }
}

const DEFAULT_RANGE_OVERLAY = () => {
  return new BoxAnnotation({
    syncable: false,
    level: "overlay",
    visible: true,
    editable: true,
    propagate_hover: true,
    left: NaN,
    right: NaN,
    top: NaN,
    bottom: NaN,
    left_limit: Node.frame.left,
    right_limit: Node.frame.right,
    top_limit: Node.frame.top,
    bottom_limit: Node.frame.bottom,
    fill_color: "lightgrey",
    fill_alpha: 0.5,
    line_color: "black",
    line_alpha: 1.0,
    line_width: 0.5,
    line_dash: [2, 2],
  })
}

export namespace RangeTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Tool.Props & {
    x_range: p.Property<Range | null>
    y_range: p.Property<Range | null>
    x_interaction: p.Property<boolean>
    y_interaction: p.Property<boolean>
    overlay: p.Property<BoxAnnotation>
  }
}

export interface RangeTool extends RangeTool.Attrs {}

export class RangeTool extends Tool {
  declare properties: RangeTool.Props
  declare __view_type__: RangeToolView

  constructor(attrs?: Partial<RangeTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RangeToolView

    this.define<RangeTool.Props>(({Bool, Ref, Nullable}) => ({
      x_range:       [ Nullable(Ref(Range)), null ],
      y_range:       [ Nullable(Ref(Range)), null ],
      x_interaction: [ Bool, true ],
      y_interaction: [ Bool, true ],
      overlay:       [ Ref(BoxAnnotation), DEFAULT_RANGE_OVERLAY ],
    }))

    this.override<RangeTool.Props>({
      active: true,
    })
  }

  override initialize(): void {
    super.initialize()
    this.update_constraints()
  }

  update_constraints(): void {
    this.overlay.editable = this.active

    const has_x = this.x_range != null && this.x_interaction
    const has_y = this.y_range != null && this.y_interaction

    if (has_x && has_y) {
      this.overlay.movable = "both"
      this.overlay.resizable = "all"
    } else if (has_x) {
      this.overlay.movable = "x"
      this.overlay.resizable = "x"
    } else if (has_y) {
      this.overlay.movable = "y"
      this.overlay.resizable = "y"
    } else {
      this.overlay.movable = "none"
      this.overlay.resizable = "none"
    }

    const {x_range, y_range} = this
    if (x_range != null) {
      this.overlay.min_width = x_range.min_interval ?? 0
      this.overlay.max_width = x_range.max_interval ?? Infinity
    }
    if (y_range != null) {
      this.overlay.min_height = y_range.min_interval ?? 0
      this.overlay.max_height = y_range.max_interval ?? Infinity
    }
  }

  update_ranges_from_overlay(): void {
    const {left, right, top, bottom} = this.overlay
    const {x_range, y_range} = this

    const affected_plots = new Set<PlotView>()
    const xrs: RangeState = new Map()
    const yrs: RangeState = new Map()

    if (x_range != null && this.x_interaction) {
      assert(isNumber(left) && isNumber(right))
      xrs.set(x_range, {start: left, end: right})
      for (const plot of x_range.plots) {
        affected_plots.add(plot)
      }
    }
    if (y_range != null && this.y_interaction) {
      assert(isNumber(bottom) && isNumber(top))
      yrs.set(y_range, {start: bottom, end: top})
      for (const plot of y_range.plots) {
        affected_plots.add(plot)
      }
    }

    for (const plot of affected_plots) {
      plot.update_range({xrs, yrs}, {panning: true, scrolling: true})
    }
  }

  private _nodes = Node.frame.freeze()

  update_overlay_from_ranges(): void {
    const {x_range, y_range} = this
    const has_x = x_range != null
    const has_y = y_range != null

    this.overlay.update({
      left: has_x ? x_range.start : this._nodes.left,
      right: has_x ? x_range.end : this._nodes.right,
      top: has_y ? y_range.end : this._nodes.top,
      bottom: has_y ? y_range.start : this._nodes.bottom,
    })

    if (!has_x && !has_y) {
      logger.warn("RangeTool not configured with any Ranges.")
      this.overlay.clear()
    }
  }

  override tool_name = "Range Tool"
  override tool_icon = tool_icon_range

  override tool_button(): OnOffButton {
    return new OnOffButton({tool: this})
  }
}
