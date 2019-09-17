import * as p from "core/properties"
import {View} from "core/view"
import {Dimensions} from "core/enums"
import {min, max} from "core/util/array"
import {Model} from "../../model"
import {Renderer} from "../renderers/renderer"
import {CartesianFrame} from "../canvas/cartesian_frame"
import {Plot, PlotView} from "../plots/plot"
import {Annotation} from "../annotations/annotation"
import {EventType, PanEvent, PinchEvent, RotateEvent, ScrollEvent, TapEvent, MoveEvent, KeyEvent} from "core/ui_events"

export abstract class ToolView extends View {
  model: Tool

  parent: PlotView

  get plot_view(): PlotView {
    return this.parent
  }

  get plot_model(): Plot {
    return this.parent.model
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => {
      if (this.model.active)
        this.activate()
      else
        this.deactivate()
    })
  }

  // activate is triggered by toolbar ui actions
  activate(): void {}

  // deactivate is triggered by toolbar ui actions
  deactivate(): void {}

  _pan_start?(e: PanEvent): void
  _pan?(e: PanEvent): void
  _pan_end?(e: PanEvent): void

  _pinch_start?(e: PinchEvent): void
  _pinch?(e: PinchEvent): void
  _pinch_end?(e: PinchEvent): void

  _rotate_start?(e: RotateEvent): void
  _rotate?(e: RotateEvent): void
  _rotate_end?(e: RotateEvent): void

  _tap?(e: TapEvent): void
  _doubletap?(e: TapEvent): void
  _press?(e: TapEvent): void

  _move_enter?(e: MoveEvent): void
  _move?(e: MoveEvent): void
  _move_exit?(e: MoveEvent): void

  _scroll?(e: ScrollEvent): void

  _keydown?(e: KeyEvent): void
  _keyup?(e: KeyEvent): void
}

export namespace Tool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    active: p.Property<boolean>
  }
}

export interface Tool extends Tool.Attrs {
  overlay?: Annotation
}

export abstract class Tool extends Model {
  properties: Tool.Props

  constructor(attrs?: Partial<Tool.Attrs>) {
    super(attrs)
  }

  static init_Tool(): void {
    this.internal({
      active: [ p.Boolean, false ],
    })
  }

  readonly event_type?: EventType | EventType[]

  get synthetic_renderers(): Renderer[] {
    return []
  }

  // utility function to return a tool name, modified
  // by the active dimensions. Used by tools that have dimensions
  protected _get_dim_tooltip(name: string, dims: Dimensions): string {
    switch (dims) {
      case "width":  return `${name} (x-axis)`
      case "height": return `${name} (y-axis)`
      case "both":   return name
    }
  }

  // utility function to get limits along both dimensions, given
  // optional dimensional constraints
  _get_dim_limits([sx0, sy0]: [number, number], [sx1, sy1]: [number, number],
      frame: CartesianFrame, dims: Dimensions): [[number, number], [number, number]] {

    const hr = frame.bbox.h_range
    let sxlim: [number, number]
    if (dims == 'width' || dims == 'both') {
      sxlim = [min([sx0, sx1]),           max([sx0, sx1])]
      sxlim = [max([sxlim[0], hr.start]), min([sxlim[1], hr.end])]
    } else
      sxlim = [hr.start, hr.end]

    const vr = frame.bbox.v_range
    let sylim: [number, number]
    if (dims == 'height' || dims == 'both') {
      sylim = [min([sy0, sy1]),           max([sy0, sy1])]
      sylim = [max([sylim[0], vr.start]), min([sylim[1], vr.end])]
    } else
      sylim = [vr.start, vr.end]

    return [sxlim, sylim]
  }
}
