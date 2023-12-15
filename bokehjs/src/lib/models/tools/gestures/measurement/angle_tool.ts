import {GestureTool, GestureToolView} from "../gesture_tool"
import {AngleUnits, Direction} from "core/enums"
import type {PanEvent} from "core/ui_events"
import type * as p from "core/properties"
import {tool_icon_geometry} from "styles/icons.css"
import {assert} from "core/util/assert"
import {atan2, invert_angle} from "core/util/math"
import {Arc} from "models/shapes/arc"
import {Marker} from "models/shapes/marker"
import {Segment} from "models/shapes/segment"
import {Label} from "models/shapes/label"
import {XY} from "models/coordinates/xy"
import {Polar} from "models/coordinates/polar"
import {VeeHead} from "models/shapes/arrow_heads"

const {min, sqrt} = Math

export class AngleToolView extends GestureToolView {
  declare model: AngleTool

  protected state: {sx: number, sy: number, dx: number, dy: number} | null = null

  protected readonly _xy0 = new XY()
  protected readonly _xy1 = new XY()

  protected readonly _arc = new Arc({coordinates: "screen", xy: this._xy0, start_angle: 0, decorations: [{marker: new VeeHead({size: 10}), node: "end"}]})
  protected readonly _hypotenuse = new Segment({coordinates: "screen", xy0: this._xy0, xy1: this._xy1})
  protected readonly _adjacent = new Segment({coordinates: "screen", xy0: this._xy0})
  protected readonly _start = new Marker({coordinates: "screen", xy: this._xy0, marker: "circle", size: 10, fill_color: "white"})
  protected readonly _end = new Marker({coordinates: "screen", xy: this._xy1, marker: "circle", size: 10, fill_color: "white"})
  protected readonly _angle = new Label({coordinates: "screen", fill_color: "white", padding: 5})
  protected readonly _length = new Label({coordinates: "screen", fill_color: "white", padding: 5})

  override get overlays() {
    const {_arc, _hypotenuse, _adjacent, _start, _end, _angle, _length} = this
    return [...super.overlays, _arc, _hypotenuse, _adjacent, _start, _end, _angle, _length]
  }

  protected _update_geometry(): void {
    assert(this.state != null)
    const {sx: x0, sy: y0, dx, dy} = this.state
    const x1 = x0 + dx
    const y1 = y0 + dy

    this._xy0.x = x0
    this._xy0.y = y0
    this._xy1.x = x0 + dx
    this._xy1.y = y0 + dy

    const length = sqrt(dx**2 + dy**2)
    const radius = min(length, 50 /*px*/)

    const angle = (() => {
      const {direction} = this.model
      const sign = direction == "anticlock" ? 1 : -1
      const angle = -sign*atan2([x0, y0], [x1, y1])
      return angle < 0 ? angle + 2*Math.PI : angle
    })()

    this._arc.radius = radius
    this._arc.end_angle = angle

    this._adjacent.xy1 = this._xy0.translate(radius, 0)

    const {precision, angle_units} = this.model

    const [ax, ay] = (() => {
      const PI2 = Math.PI/2
      if (0 <= angle && angle < PI2) {
        return [0.0, 0.5 + 0.5*(angle/PI2 - 0)]
      } else if (PI2 <= angle && angle < 2*PI2) {
        return [0.0 + 0.5*(angle/PI2 - 1), 1.0]
      } else if (2*PI2 <= angle && angle < 3*PI2) {
        return [0.5 + 0.5*(angle/PI2 - 2), 1.0]
      } else {
        return [1.0, 1.0 - 0.5*(angle/PI2 - 3)]
      }
    })()
    this._angle.anchor = [ax, ay]
    this._angle.xy = new Polar({origin: this._xy0, radius: 1.1*radius, angle: angle/2})
    this._angle.text = `${invert_angle(-angle, angle_units).toFixed(precision)}\u00b0`

    this._length.xy = this._xy1.translate(10, 0)
    this._length.text = `${length.toFixed(precision)}`
    this._length.anchor = "center_left"

    this.parent.request_paint("everything") // TODO not everything
  }

  override _pan_start(ev: PanEvent): void {
    assert(this.state == null)
    const {sx, sy} = ev
    const {bbox} = this.plot_view.frame
    if (!bbox.contains(sx, sy)) {
      return
    }
    this.state = {sx, sy, dx: 0, dy: 0}
    this._update_geometry()
  }

  override _pan(ev: PanEvent): void {
    assert(this.state != null)
    const {sx, sy} = this.state
    const {dx, dy} = ev
    this.state = {sx, sy, dx, dy}
    this._update_geometry()
  }

  override _pan_end(_e: PanEvent): void {
    assert(this.state != null)
    this.state = null
  }
}

export namespace AngleTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    angle_offset: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
    precision: p.Property<number>
    // granularity
    distance: p.Property<boolean>
    persistent: p.Property<boolean>
  }
}

export interface AngleTool extends AngleTool.Attrs {}

export class AngleTool extends GestureTool {
  declare properties: AngleTool.Props
  declare __view_type__: AngleToolView

  constructor(attrs?: Partial<AngleTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AngleToolView

    this.define<AngleTool.Props>(({Boolean, Int, NonNegative, Angle}) => ({
      angle_offset: [ Angle, 0 ],
      angle_units: [ AngleUnits, "deg" ],
      direction: [ Direction, "anticlock" ],
      precision: [ NonNegative(Int), 2 ],
      distance: [ Boolean, true ],
      persistent: [ Boolean, true ],
    }))

    this.register_alias("angle", () => new AngleTool())
  }

  override tool_name = "Angle Measurement"
  override tool_icon = tool_icon_geometry
  override event_type = "pan" as "pan"
  override default_order = 11
}
