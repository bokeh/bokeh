import {ReglWrapper} from "./regl_wrap"
import {Float32Buffer} from "./buffer"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {WedgeView} from "../wedge"

export class WedgeGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: WedgeView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "wedge"
  }

  get radius(): Float32Buffer {
    return this._widths
  }

  get start_angle(): Float32Buffer {
    return this._angles
  }

  get end_angle(): Float32Buffer {
    return this._auxs
  }

  protected override _set_data(): void {
    super._set_data()

    this.radius.set_from_array(this.glyph.sradius)

    if (this.glyph.model.direction == "anticlock") {
      this.start_angle.set_from_prop(this.glyph.start_angle)
      this.end_angle.set_from_prop(this.glyph.end_angle)
    } else {
      this.start_angle.set_from_prop(this.glyph.end_angle)
      this.end_angle.set_from_prop(this.glyph.start_angle)
    }
  }

  protected override _set_once(): void {
    super._set_once()
    this._heights.set_from_scalar(0)
  }
}
