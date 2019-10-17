import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import * as hittest from "core/hittest"
import {Selection, ImageIndex} from "../selections/selection"
import {PointGeometry} from "core/geometry"
import {SpatialIndex} from "core/util/spatial"

export interface ImageDataBase extends XYGlyphData {
  image_data: Arrayable<HTMLCanvasElement>

  _image: Arrayable<Arrayable<number> | number[][]>
  _dw: Arrayable<number>
  _dh: Arrayable<number>

  _image_shape?: Arrayable<[number, number]>

  sw: Arrayable<number>
  sh: Arrayable<number>
}

export interface ImageBaseView extends ImageDataBase {}

export class ImageBaseView extends XYGlyphView {
  model: ImageBase
  visuals: ImageBase.Visuals

  protected _width: Arrayable<number>
  protected _height: Arrayable<number>

  protected _render(_ctx: Context2d, _indices: number[], _data: ImageDataBase): void {}

  _index_data(): SpatialIndex {
    const points = []
    for (let i = 0, end = this._x.length; i < end; i++) {
      const [l, r, t, b] = this._lrtb(i)
      if (isNaN(l + r + t + b) || !isFinite(l + r + t + b)) {
        continue
      }
      points.push({x0: l, y0: b, x1: r, y1: t, i})
    }
    return new SpatialIndex(points)
  }

  _lrtb(i: number): [number, number, number, number]{
    const xr = this.renderer.xscale.source_range
    const x1 = this._x[i]
    const x2 = xr.is_reversed ? x1 - this._dw[i] : x1 + this._dw[i]

    const yr = this.renderer.yscale.source_range
    const y1 = this._y[i]
    const y2 = yr.is_reversed ? y1 - this._dh[i] : y1 + this._dh[i]

    const [l, r] = x1 < x2 ? [x1, x2] : [x2, x1]
    const [b, t] = y1 < y2 ? [y1, y2] : [y2, y1]
    return [l, r, t, b]
  }

  protected _set_width_heigh_data(): void {
    if (this.image_data == null || this.image_data.length != this._image.length)
      this.image_data = new Array(this._image.length)

    if (this._width == null || this._width.length != this._image.length)
      this._width = new Array(this._image.length)

    if (this._height == null || this._height.length != this._image.length)
      this._height = new Array(this._image.length)
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

  protected _set_image_data_from_buffer(i: number, buf8: Uint8Array): void {
    const canvas = this._get_or_create_canvas(i)
    const ctx = canvas.getContext('2d')!
    const image_data = ctx.getImageData(0, 0, this._width[i], this._height[i])
    image_data.data.set(buf8)
    ctx.putImageData(image_data, 0, 0)
    this.image_data[i] = canvas
  }

  protected _map_data(): void {
    switch (this.model.properties.dw.units) {
      case "data": {
        this.sw = this.sdist(this.renderer.xscale, this._x, this._dw, 'edge', this.model.dilate)
        break
      }
      case "screen": {
        this.sw = this._dw
        break
      }
    }

    switch (this.model.properties.dh.units) {
      case "data": {
        this.sh = this.sdist(this.renderer.yscale, this._y, this._dh, 'edge', this.model.dilate)
        break
      }
      case "screen": {
        this.sh = this._dh
        break
      }
    }
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
    const result = hittest.create_empty_hit_test_result()

    result.image_indices = []
    for (const index of candidates) {
      if ((sx != Infinity) && (sy != Infinity)) {
        result.image_indices.push(this._image_index(index, x, y))
      }
    }
    return result
  }

}

export namespace ImageBase {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    image: p.NumberSpec
    dw: p.DistanceSpec
    dh: p.DistanceSpec
    global_alpha: p.Property<number>
    dilate: p.Property<boolean>
  }

  export type Visuals = XYGlyph.Visuals
}

export interface ImageBase extends ImageBase.Attrs {}

export class ImageBase extends XYGlyph {
  properties: ImageBase.Props

  constructor(attrs?: Partial<ImageBase.Attrs>) {
    super(attrs)
  }

  static init_ImageBase(): void {
    this.prototype.default_view = ImageBaseView

    this.define<ImageBase.Props>({
      image:        [ p.NumberSpec       ], // TODO (bev) array spec?
      dw:           [ p.DistanceSpec     ],
      dh:           [ p.DistanceSpec     ],
      dilate:       [ p.Boolean,   false ],
      global_alpha: [ p.Number,    1.0   ],
    })
  }
}
