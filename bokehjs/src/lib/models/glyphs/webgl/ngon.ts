import type {ReglWrapper} from "./regl_wrap"
import {RadialGL} from "./radial"
import type {GLMarkerType} from "./types"
import type {NgonView} from "../ngon"

export class NgonGL extends RadialGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: NgonView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "ngon"
  }

  protected override _set_data(): void {
    super._set_data()
    this._angles.set_from_prop(this.glyph.angle)
    this._auxs.set_from_prop(this.glyph.n)
  }
}
