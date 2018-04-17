import {GestureTool, GestureToolView} from "./gesture_tool"
import * as p from "core/properties"
import {GestureEvent} from "core/ui_events"
import {Dimensions} from "core/enums"

export class PanToolView extends GestureToolView {
  model: PanTool

  protected last_dx: number
  protected last_dy: number

  protected v_axis_only: boolean
  protected h_axis_only: boolean

  protected pan_info: {
    xrs: {[key: string]: {start: number, end: number}}
    yrs: {[key: string]: {start: number, end: number}}
    sdx: number
    sdy: number
  }

  _pan_start(ev: GestureEvent): void {
    this.last_dx = 0
    this.last_dy = 0
    const {sx, sy} = ev
    const bbox = this.plot_model.frame.bbox
    if (!bbox.contains(sx, sy)) {
      const hr = bbox.h_range
      const vr = bbox.v_range
      if (sx < hr.start || sx > hr.end)
        this.v_axis_only = true
      if (sy < vr.start || sy > vr.end)
        this.h_axis_only = true
    }

    if (this.model.document != null)
      this.model.document.interactive_start(this.plot_model.plot)
  }

  _pan(ev: GestureEvent): void {
    this._update(ev.deltaX, ev.deltaY)

    if (this.model.document != null)
      this.model.document.interactive_start(this.plot_model.plot)
  }

  _pan_end(_e: GestureEvent): void {
    this.h_axis_only = false
    this.v_axis_only = false

    if (this.pan_info != null)
      this.plot_view.push_state('pan', {range: this.pan_info})
  }

  _update(dx: number, dy: number): void {
    const frame = this.plot_model.frame

    const new_dx = dx - this.last_dx
    const new_dy = dy - this.last_dy

    const hr = frame.bbox.h_range
    const sx_low  = hr.start - new_dx
    const sx_high = hr.end - new_dx

    const vr = frame.bbox.v_range
    const sy_low  = vr.start - new_dy
    const sy_high = vr.end - new_dy

    const dims = this.model.dimensions

    let sx0: number
    let sx1: number
    let sdx: number
    if ((dims == 'width' || dims == 'both') && !this.v_axis_only) {
      sx0 = sx_low
      sx1 = sx_high
      sdx = -new_dx
    } else {
      sx0 = hr.start
      sx1 = hr.end
      sdx = 0
    }

    let sy0: number
    let sy1: number
    let sdy: number
    if ((dims == 'height' || dims == 'both') && !this.h_axis_only) {
      sy0 = sy_low
      sy1 = sy_high
      sdy = -new_dy
    } else {
      sy0 = vr.start
      sy1 = vr.end
      sdy = 0
    }

    this.last_dx = dx
    this.last_dy = dy

    const {xscales, yscales} = frame

    const xrs: {[key: string]: {start: number, end: number}} = {}
    for (const name in xscales) {
      const scale = xscales[name]
      const [start, end] = scale.r_invert(sx0, sx1)
      xrs[name] = {start: start, end: end}
    }

    const yrs: {[key: string]: {start: number, end: number}} = {}
    for (const name in yscales) {
      const scale = yscales[name]
      const [start, end] = scale.r_invert(sy0, sy1)
      yrs[name] = {start: start, end: end}
    }

    this.pan_info = {
      xrs: xrs,
      yrs: yrs,
      sdx: sdx,
      sdy: sdy,
    }

    this.plot_view.update_range(this.pan_info, true)
  }
}

export namespace PanTool {
  export interface Attrs extends GestureTool.Attrs {
    dimensions: Dimensions
  }

  export interface Props extends GestureTool.Props {}
}

export interface PanTool extends PanTool.Attrs {}

export class PanTool extends GestureTool {

  properties: PanTool.Props

  constructor(attrs?: Partial<PanTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "PanTool"
    this.prototype.default_view = PanToolView

    this.define({
      dimensions: [ p.Dimensions, "both" ],
    })
  }

  tool_name = "Pan"
  event_type = "pan" as "pan"
  default_order = 10

  get tooltip(): string {
    return this._get_dim_tooltip("Pan", this.dimensions)
  }

  get icon(): string {
    switch (this.dimensions) {
      case "both":   return "bk-tool-icon-pan"
      case "width":  return "bk-tool-icon-xpan"
      case "height": return "bk-tool-icon-ypan"
    }
  }
}

PanTool.initClass()
