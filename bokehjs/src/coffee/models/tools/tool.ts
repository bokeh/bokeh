import * as p from "core/properties"
import {View} from "core/view"
import {Dimensions} from "core/enums"
import {min, max} from "core/util/array"
import {Model} from "../../model"
import {Renderer} from "../renderers/renderer"
import {CartesianFrame} from "../canvas/cartesian_frame"
import {PlotCanvas, PlotCanvasView} from "../plots/plot_canvas"

export class ToolView extends View {

  model: Tool

  plot_view: PlotCanvasView

  initialize(options: any): void {
    super.initialize(options)
    this.plot_view = options.plot_view
  }

  get plot_model(): PlotCanvas {
    return this.plot_view.model
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
}

export class Tool extends Model {

  static initClass() {
    this.prototype.type = "Tool"

    this.internal({
      active: [ p.Boolean, false ]
    })
  }

  active: boolean
  overlay?: Renderer

  get synthetic_renderers(): Renderer[] {
    return []
  }

  // utility function to return a tool name, modified
  // by the active dimenions. Used by tools that have dimensions
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

Tool.initClass()
