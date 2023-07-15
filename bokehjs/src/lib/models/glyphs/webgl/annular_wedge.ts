import type {ReglWrapper} from "./regl_wrap"
import type {Float32Buffer} from "./buffer"
import {SXSYGlyphGL} from "./sxsy"
import type {GLMarkerType} from "./types"
import type {AnnularWedgeView} from "../annular_wedge"

export class AnnularWedgeGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: AnnularWedgeView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "annular_wedge"
  }

  get outer_radius(): Float32Buffer {
    return this._widths
  }

  get inner_radius(): Float32Buffer {
    return this._heights
  }

  get start_angle(): Float32Buffer {
    return this._angles
  }

  get end_angle(): Float32Buffer {
    return this._auxs
  }

  protected override _set_data(): void {
    super._set_data()

    this.outer_radius.set_from_array(this.glyph.souter_radius)
    this.inner_radius.set_from_array(this.glyph.sinner_radius)

    if (this.glyph.model.direction == "anticlock") {
      this.start_angle.set_from_prop(this.glyph.start_angle)
      this.end_angle.set_from_prop(this.glyph.end_angle)
    } else {
      this.start_angle.set_from_prop(this.glyph.end_angle)
      this.end_angle.set_from_prop(this.glyph.start_angle)
    }
  }
}
