import type {ReglWrapper} from "./regl_wrap"
import {RadialGL} from "./radial"
import type {GLMarkerType} from "./types"
import type {CircleView} from "../circle"

export class CircleGL extends RadialGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: CircleView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "circle"
  }

  protected override _set_once(): void {
    super._set_once()
    this._angles.set_from_scalar(0)
  }
}
