import type {Transform} from "./base"
import {BaseGLGlyph} from "./base"
import {Float32Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {ImageProps} from "./types"
import type {ImageBaseView} from "../image_base"
import type {Texture2D, Texture2DOptions} from "regl"
import {assert} from "core/util/assert"

export class ImageGL extends BaseGLGlyph {
  // data properties
  protected _tex: (Texture2D | null)[] = []
  protected _bounds: (Float32Buffer | null)[] = []

  // image_changed is separate from data_changed as it can occur through changed colormapping.
  protected _image_changed: boolean = false

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: ImageBaseView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: ImageBaseView, transform: Transform): void {
    const main_gl_glyph = main_glyph.glglyph! as ImageGL
    // The only visual property that can change is global_alpha and that is read on every render,
    // so ignore this.visuals_changed

    const data_changed_or_mapped = main_gl_glyph.data_changed || main_gl_glyph.data_mapped

    if (data_changed_or_mapped) {
      // Handle change of location or bounds.
      main_gl_glyph._set_data()
    }

    if (main_gl_glyph._image_changed || main_gl_glyph.data_changed) {
      // Handle change of image itself. If _image_changed then image has definitely changed such as
      // from a change of colormapping. If data_changed then image may have changed so update just
      // in case. If we could identify what in the CDS has changed (e.g. image or x) then we would
      // know whether to call _set_image or not.
      main_gl_glyph._set_image()
    }

    main_gl_glyph.data_changed = false
    main_gl_glyph.data_mapped = false
    main_gl_glyph._image_changed = false

    const {global_alpha} = this.glyph.visuals.image

    for (const i of indices) {
      if (main_gl_glyph._tex[i] == null || main_gl_glyph._bounds[i] == null) {
        continue
      }

      const props: ImageProps = {
        scissor: this.regl_wrapper.scissor,
        viewport: this.regl_wrapper.viewport,
        canvas_size: [transform.width, transform.height],
        bounds: main_gl_glyph._bounds[i],
        tex: main_gl_glyph._tex[i],
        global_alpha: global_alpha.get(i),
      }
      this.regl_wrapper.image()(props)
    }
  }

  set_image_changed(): void {
    this._image_changed = true
  }

  protected _set_data(): void {
    const {image} = this.glyph
    const nimage = image.length

    if (this._bounds.length != nimage) {
      this._bounds = Array(nimage).fill(null)
    }

    for (let i = 0; i < nimage; i++) {
      const {sx, sy, sdw: sw, sdh: sh, xy_anchor, xy_scale, xy_sign} = this.glyph
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sw_i = sw[i]
      const sh_i = sh[i]

      if (!isFinite(sx_i + sy_i + sw_i + sh_i)) {
        this._bounds[i] = null
        continue
      }

      if (this._bounds[i] == null) {
        this._bounds[i] = new Float32Buffer(this.regl_wrapper)
      }
      const bounds_array = this._bounds[i]!.get_sized_array(4)

      bounds_array[0] = sx[i] + sw[i]*(0.5*(1 - xy_scale.x) - xy_anchor.x)*xy_sign.x
      bounds_array[1] = sy[i] + sh[i]*(0.5*(1 - xy_scale.y) - xy_anchor.y)*xy_sign.y
      bounds_array[2] = bounds_array[0] + sw[i]*xy_scale.x*xy_sign.x
      bounds_array[3] = bounds_array[1] + sh[i]*xy_scale.y*xy_sign.y

      this._bounds[i]!.update()
    }
  }

  protected _set_image(): void {
    const {image, image_data} = this.glyph
    const nimage = image.length

    assert(image_data != null)

    if (this._tex.length != nimage) {
      this._tex = Array(nimage).fill(null)
    }

    for (let i = 0; i < nimage; i++) {
      const image_data_i = image_data[i]

      if (image_data_i == null) {
        this._tex[i] = null
        continue
      }

      const tex_options: Texture2DOptions = {
        width: image_data_i.width,
        height: image_data_i.height,
        data: image_data_i,
        format: "rgba",
        type: "uint8",
      }

      if (this._tex[i] == null) {
        this._tex[i] = this.regl_wrapper.texture(tex_options)
      } else {
        this._tex[i]!(tex_options) // Reuse existing WebGL texture
      }
    }
  }
}
