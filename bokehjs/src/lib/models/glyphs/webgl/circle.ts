import {ReglWrapper} from "./regl_wrap"
import {Float32Buffer} from "./buffer"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {CircleView} from "../circle"
import {mul} from "core/util/arrayable"

export class CircleGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: CircleView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "circle"
  }

  // TODO: should be 'radius'
  get size(): Float32Buffer {
    return this._widths
  }

  protected override _set_data(): void {
    super._set_data()

    // Ideally we wouldn't multiply here, but currently handling of
    // circle glyph and scatter with circle marker is handled with
    // a single code path.
    this.size.set_from_array(mul(this.glyph.sradius, 2.0))
  }

  protected override _set_once(): void {
    super._set_once()
    this._heights.set_from_scalar(0)
    this._angles.set_from_scalar(0)
  }
}
