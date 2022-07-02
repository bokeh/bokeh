import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {Arrayable, ScreenArray, to_screen} from "core/types"
import {Anchor, Align, HAlign, VAlign, ImageOrigin} from "core/enums"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {Selection, ImageIndex} from "../selections/selection"
import {PointGeometry} from "core/geometry"
import {SpatialIndex} from "core/util/spatial"
import {NDArray} from "core/util/ndarray"
import {assert} from "core/util/assert"
import {isString} from "core/util/types"

export type ImageDataBase = XYGlyphData & {
  image_data: HTMLCanvasElement[]

  readonly image: p.Uniform<NDArray>
  readonly dw: p.Uniform<number>
  readonly dh: p.Uniform<number>
  readonly global_alpha: p.Uniform<number>

  sw: ScreenArray
  sh: ScreenArray
}

export interface ImageBaseView extends ImageDataBase {}

export abstract class ImageBaseView extends XYGlyphView {
  override model: ImageBase
  override visuals: ImageBase.Visuals

  protected _width: Uint32Array
  protected _height: Uint32Array

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  get xy_scale(): [number, number] {
    switch (this.model.origin) {
      case "bottom_left":  return [ 1, -1]
      case "top_left":     return [ 1,  1]
      case "bottom_right": return [-1, -1]
      case "top_right":    return [-1,  1]
    }
  }

  get xy_offset(): [number, number] {
    switch (this.model.origin) {
      case "bottom_left":  return [0.0, 1.0]
      case "top_left":     return [0.0, 0.0]
      case "bottom_right": return [1.0, 1.0]
      case "top_right":    return [1.0, 0.0]
    }
  }

  get xy_anchor(): [number, number] {
    const {anchor} = this.model
    if (isString(anchor)) {
      switch (anchor) {
        case "top_left":      return [0.0, 0.0]
        case "top":
        case "top_center":    return [0.5, 0.0]
        case "top_right":     return [1.0, 0.0]
        case "right":
        case "center_right":  return [1.0, 0.5]
        case "bottom_right":  return [1.0, 1.0]
        case "bottom":
        case "bottom_center": return [0.5, 1.0]
        case "bottom_left":   return [0.0, 1.0]
        case "left":
        case "center_left":   return [0.0, 0.5]
        case "center":
        case "center_center": return [0.5, 0.5]
      }
    } else {
      const x_anchor = (() => {
        const [x_anchor] = anchor
        switch (x_anchor) {
          case "start":
          case "left":   return 0.0
          case "center": return 0.5
          case "end":
          case "right":  return 1.0
          default:
            return x_anchor
        }
      })()
      const y_anchor = (() => {
        const [, y_anchor] = anchor
        switch (y_anchor) {
          case "start":
          case "top":    return 0.0
          case "center": return 0.5
          case "end":
          case "bottom": return 1.0
          default:
            return y_anchor
        }
      })()
      return [x_anchor, y_anchor]
    }
  }

  get xy_sign(): [number, number] {
    const xr = this.renderer.xscale.source_range
    const yr = this.renderer.yscale.source_range

    const x_sign = xr.is_reversed ? -1 : 1
    const y_sign = yr.is_reversed ? -1 : 1

    return [x_sign, y_sign]
  }

  protected _render(ctx: Context2d, indices: number[], data?: ImageDataBase): void {
    const {image_data, sx, sy, sw, sh, global_alpha} = data ?? this

    const old_smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    const scalar_alpha = global_alpha.is_Scalar()
    if (scalar_alpha)
      ctx.globalAlpha = global_alpha.value

    const [x_sign, y_sign] = this.xy_sign
    const [x_scale, y_scale] = this.xy_scale
    const [x_offset, y_offset] = this.xy_offset
    const [x_anchor, y_anchor] = this.xy_anchor

    for (const i of indices) {
      const image_data_i = image_data[i]
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sw_i = sw[i]
      const sh_i = sh[i]
      const alpha_i = this.global_alpha.get(i)

      if (image_data_i == null || !isFinite(sx_i + sy_i + sw_i + sh_i + alpha_i))
        continue

      if (!scalar_alpha)
        ctx.globalAlpha = alpha_i

      const tx_i = x_sign*x_anchor*sw_i
      const ty_i = y_sign*y_anchor*sh_i

      ctx.save()
      ctx.translate(sx_i - tx_i, sy_i - ty_i)
      ctx.scale(x_sign*x_scale, y_sign*y_scale)
      ctx.drawImage(image_data_i, -x_offset*sw_i, -y_offset*sh_i, sw_i, sh_i)
      ctx.restore()
    }

    ctx.setImageSmoothingEnabled(old_smoothing)
  }

  protected abstract _flat_img_to_buf8(img: Arrayable<number>): Uint8ClampedArray

  protected override _set_data(indices: number[] | null): void {
    this._set_width_heigh_data()

    for (let i = 0, end = this.image.length; i < end; i++) {
      if (indices != null && indices.indexOf(i) < 0)
        continue

      const img = this.image.get(i)
      assert(img.dimension == 2, "expected a 2D array")
      this._height[i] = img.shape[0]
      this._width[i] = img.shape[1]

      const buf8 = this._flat_img_to_buf8(img)
      this._set_image_data_from_buffer(i, buf8)
    }
  }

  protected override _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const [l, r, t, b] = this._lrtb(i)
      index.add_rect(l, b, r, t)
    }
  }

  _lrtb(i: number): [number, number, number, number] {
    const dw_i = this.dw.get(i)
    const dh_i = this.dh.get(i)

    const x_i = this._x[i]
    const y_i = this._y[i]

    const [x_sign, y_sign] = this.xy_sign
    const [x_anchor, y_anchor] = this.xy_anchor

    const [x0, x1] = [x_i - x_sign*x_anchor*dw_i, x_i + x_sign*(1 - x_anchor)*dw_i]
    const [y0, y1] = [y_i + y_sign*y_anchor*dh_i, y_i - y_sign*(1 - y_anchor)*dh_i]

    const [l, r] = x0 < x1 ? [x0, x1] : [x1, x0]
    const [b, t] = y0 < y1 ? [y0, y1] : [y1, y0]
    return [l, r, t, b]
  }

  protected _set_width_heigh_data(): void {
    if (this.image_data == null || this.image_data.length != this.image.length)
      this.image_data = new Array(this.image.length)

    if (this._width == null || this._width.length != this.image.length)
      this._width = new Uint32Array(this.image.length)

    if (this._height == null || this._height.length != this.image.length)
      this._height = new Uint32Array(this.image.length)
  }

  protected _get_or_create_canvas(i: number): HTMLCanvasElement {
    const _image_data = this.image_data[i]
    if (_image_data != null && _image_data.width == this._width[i] &&
                               _image_data.height == this._height[i])
      return _image_data
    else {
      const canvas = document.createElement("canvas")
      canvas.width = this._width[i]
      canvas.height = this._height[i]
      return canvas
    }
  }

  protected _set_image_data_from_buffer(i: number, buf8: Uint8ClampedArray): void {
    const canvas = this._get_or_create_canvas(i)
    const ctx = canvas.getContext("2d")!
    const image_data = ctx.getImageData(0, 0, this._width[i], this._height[i])
    image_data.data.set(buf8)
    ctx.putImageData(image_data, 0, 0)
    this.image_data[i] = canvas
  }

  protected override _map_data(): void {
    if (this.model.properties.dw.units == "data")
      this.sw = this.sdist(this.renderer.xscale, this._x, this.dw, "edge", this.model.dilate)
    else
      this.sw = to_screen(this.dw)

    if (this.model.properties.dh.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this.dh, "edge", this.model.dilate)
    else
      this.sh = to_screen(this.dh)
  }

  _image_index(index: number, x: number, y: number): ImageIndex {
    const [l, r, t, b] = this._lrtb(index)
    const width = this._width[index]
    const height = this._height[index]
    const dx = (r - l) / width
    const dy = (t - b) / height
    let i = Math.floor((x - l) / dx)
    let j = Math.floor((y - b) / dy)
    if (this.renderer.xscale.source_range.is_reversed)
      i = width-i-1
    if (this.renderer.yscale.source_range.is_reversed)
      j = height-j-1
    return {index, i, j, flat_index: j*width + i}
  }

  override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({x0: x, x1: x, y0: y, y1: y})
    const result = new Selection()

    const indices = []
    for (const index of candidates) {
      if (sx != Infinity && sy != Infinity) {
        indices.push(index)
        result.image_indices.push(this._image_index(index, x, y))
      }
    }
    result.indices = indices

    return result
  }
}

export namespace ImageBase {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    image: p.NDArraySpec
    dw: p.DistanceSpec
    dh: p.DistanceSpec
    global_alpha: p.NumberSpec
    dilate: p.Property<boolean>
    origin: p.Property<ImageOrigin>
    anchor: p.Property<Anchor | [Align | HAlign | number, Align | VAlign | number]>
  }

  export type Visuals = XYGlyph.Visuals
}

export interface ImageBase extends ImageBase.Attrs {}

export abstract class ImageBase extends XYGlyph {
  override properties: ImageBase.Props
  override __view_type__: ImageBaseView

  constructor(attrs?: Partial<ImageBase.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ImageBase.Props>(({Boolean, Number, Or, Tuple}) => ({
      image:        [ p.NDArraySpec, {field: "image"} ],
      dw:           [ p.DistanceSpec, {field: "dw"} ],
      dh:           [ p.DistanceSpec, {field: "dh"} ],
      global_alpha: [ p.NumberSpec, {value: 1.0} ],
      dilate:       [ Boolean, false ],
      origin:       [ ImageOrigin, "bottom_left" ],
      anchor:       [ Or(Anchor, Tuple(Or(Align, HAlign, Number), Or(Align, VAlign, Number))), "bottom_left" ],
    }))
  }
}
