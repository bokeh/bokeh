import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {Arrayable, ScreenArray, to_screen} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {Selection, ImageIndex} from "../selections/selection"
import {PointGeometry} from "core/geometry"
import {SpatialIndex} from "core/util/spatial"
import {concat} from "core/util/array"
import {NDArray, is_NDArray} from "core/util/ndarray"
import {assert} from "core/util/assert"

export type ImageDataBase = XYGlyphData & {
  image_data: HTMLCanvasElement[]

  readonly image: p.Uniform<NDArray | number[][]>
  readonly dw: p.Uniform<number>
  readonly dh: p.Uniform<number>

  sw: ScreenArray
  sh: ScreenArray
}

export interface ImageBaseView extends ImageDataBase {}

export abstract class ImageBaseView extends XYGlyphView {
  model: ImageBase
  visuals: ImageBase.Visuals

  protected _width: Uint32Array
  protected _height: Uint32Array

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  protected _render(ctx: Context2d, indices: number[], data?: ImageDataBase): void {
    const {image_data, sx, sy, sw, sh} = data ?? this

    const old_smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    ctx.globalAlpha = this.model.global_alpha

    for (const i of indices) {
      const image_data_i = image_data[i]
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sw_i = sw[i]
      const sh_i = sh[i]

      if (image_data_i == null || isNaN(sx_i + sy_i + sw_i + sh_i))
        continue

      const y_offset = sy_i

      ctx.translate(0, y_offset)
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)
      ctx.drawImage(image_data_i, sx_i|0, sy_i|0, sw_i, sh_i)
      ctx.translate(0, y_offset)
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)
    }

    ctx.setImageSmoothingEnabled(old_smoothing)
  }

  protected abstract _flat_img_to_buf8(img: Arrayable<number>): Uint8ClampedArray

  protected _set_data(indices: number[] | null): void {
    this._set_width_heigh_data()

    for (let i = 0, end = this.image.length; i < end; i++) {
      if (indices != null && indices.indexOf(i) < 0)
        continue

      const img = this.image.get(i)
      let flat_img: Arrayable<number>
      if (is_NDArray(img)) {
        assert(img.dimension == 2, "expected a 2D array")
        flat_img = img
        this._height[i] = img.shape[0]
        this._width[i] = img.shape[1]
      } else {
        flat_img = concat(img)
        this._height[i] = img.length
        this._width[i] = img[0].length
      }

      const buf8 = this._flat_img_to_buf8(flat_img)
      this._set_image_data_from_buffer(i, buf8)
    }
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const [l, r, t, b] = this._lrtb(i)
      if (isNaN(l + r + t + b) || !isFinite(l + r + t + b))
        index.add_empty()
      else
        index.add(l, b, r, t)
    }
  }

  _lrtb(i: number): [number, number, number, number]{
    const dw_i = this.dw.get(i)
    const dh_i = this.dh.get(i)

    const xr = this.renderer.xscale.source_range
    const x1 = this._x[i]
    const x2 = xr.is_reversed ? x1 - dw_i : x1 + dw_i

    const yr = this.renderer.yscale.source_range
    const y1 = this._y[i]
    const y2 = yr.is_reversed ? y1 - dh_i : y1 + dh_i

    const [l, r] = x1 < x2 ? [x1, x2] : [x2, x1]
    const [b, t] = y1 < y2 ? [y1, y2] : [y2, y1]
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
      const canvas = document.createElement('canvas')
      canvas.width = this._width[i]
      canvas.height = this._height[i]
      return canvas
    }
  }

  protected _set_image_data_from_buffer(i: number, buf8: Uint8ClampedArray): void {
    const canvas = this._get_or_create_canvas(i)
    const ctx = canvas.getContext('2d')!
    const image_data = ctx.getImageData(0, 0, this._width[i], this._height[i])
    image_data.data.set(buf8)
    ctx.putImageData(image_data, 0, 0)
    this.image_data[i] = canvas
  }

  protected _map_data(): void {
    if (this.model.properties.dw.units == "data")
      this.sw = this.sdist(this.renderer.xscale, this._x, this.dw, 'edge', this.model.dilate)
    else
      this.sw = to_screen(this.dw)

    if (this.model.properties.dh.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this.dh, 'edge', this.model.dilate)
    else
      this.sh = to_screen(this.dh)
  }

  _image_index(index: number, x: number, y: number): ImageIndex {
    const [l, r, t, b] = this._lrtb(index)
    const width = this._width[index]
    const height = this._height[index]
    const dx = (r - l) / width
    const dy = (t - b) / height
    let dim1 = Math.floor((x - l) / dx)
    let dim2 = Math.floor((y - b) / dy)
    if (this.renderer.xscale.source_range.is_reversed)
      dim1 = width-dim1-1
    if (this.renderer.yscale.source_range.is_reversed)
      dim2 = height-dim2-1
    return {index, dim1, dim2, flat_index: dim2*width + dim1}
  }

  _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({x0: x, x1: x, y0: y, y1: y})
    const result = new Selection()

    for (const index of candidates) {
      if (sx != Infinity && sy != Infinity) {
        result.image_indices.push(this._image_index(index, x, y))
      }
    }

    return result
  }
}

export namespace ImageBase {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    image: p.NDArraySpec
    dw: p.DistanceSpec
    dh: p.DistanceSpec
    global_alpha: p.Property<number>
    dilate: p.Property<boolean>
  }

  export type Visuals = XYGlyph.Visuals
}

export interface ImageBase extends ImageBase.Attrs {}

export abstract class ImageBase extends XYGlyph {
  properties: ImageBase.Props
  __view_type__: ImageBaseView

  constructor(attrs?: Partial<ImageBase.Attrs>) {
    super(attrs)
  }

  static init_ImageBase(): void {
    this.define<ImageBase.Props>(({Boolean, Alpha}) => ({
      image:        [ p.NDArraySpec, {field: "image"} ],
      dw:           [ p.DistanceSpec, {field: "dw"} ],
      dh:           [ p.DistanceSpec, {field: "dh"} ],
      dilate:       [ Boolean, false ],
      global_alpha: [ Alpha, 1.0 ],
    }))
  }
}
