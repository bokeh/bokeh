import {Transform} from "./base"
import {MarkerVisuals} from "./base_marker"
import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL} from "./single_marker"

import type {AnnulusView} from "../annulus"

export class AnnulusGL extends SingleMarkerGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: AnnulusView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: AnnulusView, transform: Transform): void {
    this._draw_impl(indices, transform, main_glyph.glglyph!, "annulus")
  }

  protected override _get_visuals(): MarkerVisuals {
    return this.glyph.visuals
  }

  protected override _set_data(): void {
    const nmarkers = this.nvertices

    if (this._centers == null) {
      // Either all or none are set.
      this._centers = new Float32Buffer(this.regl_wrapper)
      this._widths = new Float32Buffer(this.regl_wrapper)
      this._heights = this._widths
      this._angles = new Float32Buffer(this.regl_wrapper)
    }

    const centers_array = this._centers.get_sized_array(nmarkers*2)
    const widths_array = this._widths!.get_sized_array(nmarkers)
    for (let i = 0; i < nmarkers; i++) {
      if (isFinite(this.glyph.sx[i]) && isFinite(this.glyph.sy[i])) {
        centers_array[2*i  ] = this.glyph.sx[i]
        centers_array[2*i+1] = this.glyph.sy[i]
      } else {
        centers_array[2*i  ] = SingleMarkerGL.missing_point
        centers_array[2*i+1] = SingleMarkerGL.missing_point
      }
      widths_array[i] = this.glyph.souter_radius[i]*2
    }
    this._centers.update()
    this._widths!.update()

    this._angles!.set_from_scalar(0, 1)
  }
}
