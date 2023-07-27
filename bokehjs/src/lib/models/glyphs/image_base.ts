import type {XYGlyphData} from "./xy_glyph"
import {XYGlyph, XYGlyphView} from "./xy_glyph"
import type {ScreenArray} from "core/types"
import {to_screen} from "core/types"
import {ImageOrigin} from "core/enums"
import * as p from "core/properties"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type {Context2d} from "core/util/canvas"
import type {ImageIndex} from "../selections/selection"
import {Selection} from "../selections/selection"
import type {PointGeometry} from "core/geometry"
import type {SpatialIndex} from "core/util/spatial"
import type {NDArrayType} from "core/util/ndarray"
import {assert} from "core/util/assert"
import type {XY} from "core/util/bbox"
import {Anchor} from "../common/kinds"
import {anchor} from "../common/resolve"

type ImageData = HTMLCanvasElement | null

export type ImageDataBase = XYGlyphData & {
  readonly image_data: ImageData[]

  readonly image: p.Uniform<NDArrayType<number>>
  readonly dw: p.Uniform<number>
  readonly dh: p.Uniform<number>

  sw: ScreenArray
  sh: ScreenArray
}

export interface ImageBaseView extends ImageDataBase {}

export abstract class ImageBaseView extends XYGlyphView {
  declare model: ImageBase
  declare visuals: ImageBase.Visuals

  protected _image_data: ImageData[] | null = null

  get image_data(): ImageData[] {
    assert(this._image_data != null, "data not set")
    return this._image_data
  }

  protected _width: Uint32Array
  protected _height: Uint32Array

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  get image_dimension(): number {
    return 2
  }

  get xy_scale(): XY<number> {
    switch (this.model.origin) {
      case "bottom_left":  return {x:  1, y: -1}
      case "top_left":     return {x:  1, y:  1}
      case "bottom_right": return {x: -1, y: -1}
      case "top_right":    return {x: -1, y:  1}
    }
  }

  get xy_offset(): XY<number> {
    switch (this.model.origin) {
      case "bottom_left":  return {x: 0.0, y: 1.0}
      case "top_left":     return {x: 0.0, y: 0.0}
      case "bottom_right": return {x: 1.0, y: 1.0}
      case "top_right":    return {x: 1.0, y: 0.0}
    }
  }

  get xy_anchor(): XY<number> {
    return anchor(this.model.anchor)
  }

  get xy_sign(): XY<number> {
    const xr = this.renderer.xscale.source_range
    const yr = this.renderer.yscale.source_range

    return {
      x: xr.is_reversed ? -1 : 1,
      y: yr.is_reversed ? -1 : 1,
    }
  }

  protected _render(ctx: Context2d, indices: number[], data?: ImageDataBase): void {
    const {image_data, sx, sy, sw, sh} = data ?? this
    const {xy_sign, xy_scale, xy_offset, xy_anchor} = this

    ctx.save()
    ctx.imageSmoothingEnabled = false

    if (this.visuals.image.doit) {
      for (const i of indices) {
        const image_data_i = image_data[i]
        const sx_i = sx[i]
        const sy_i = sy[i]
        const sw_i = sw[i]
        const sh_i = sh[i]

        if (image_data_i == null || !isFinite(sx_i + sy_i + sw_i + sh_i))
          continue

        const tx_i = xy_sign.x*xy_anchor.x*sw_i
        const ty_i = xy_sign.y*xy_anchor.y*sh_i

        ctx.save()
        ctx.translate(sx_i - tx_i, sy_i - ty_i)
        ctx.scale(xy_sign.x*xy_scale.x, xy_sign.y*xy_scale.y)
        this.visuals.image.set_vectorize(ctx, i)
        ctx.drawImage(image_data_i, -xy_offset.x*sw_i, -xy_offset.y*sh_i, sw_i, sh_i)
        ctx.restore()
      }
    }

    ctx.restore()
  }

  // public so can be called by ImageGL class.
  public abstract _flat_img_to_buf8(img: NDArrayType<number>): Uint8ClampedArray

  protected override _set_data(indices: number[] | null): void {
    const n = this.data_size

    if (this._image_data == null || this._image_data.length != n) {
      this._image_data = new Array(n).fill(null)
      this._width = new Uint32Array(n)
      this._height = new Uint32Array(n)
    }

    const {image_dimension} = this

    for (let i = 0; i < n; i++) {
      if (indices != null && !indices.includes(i))
        continue

      const img = this.image.get(i)
      assert(img.dimension == image_dimension, `expected a ${image_dimension}D array, not ${img.dimension}D`)

      const [width, height] = img.shape
      this._height[i] = width
      this._width[i] = height

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

    const {xy_anchor} = this

    const [x0, x1] = [x_i - xy_anchor.x*dw_i, x_i + (1 - xy_anchor.x)*dw_i]
    const [y0, y1] = [y_i + xy_anchor.y*dh_i, y_i - (1 - xy_anchor.y)*dh_i]

    const [l, r] = x0 <= x1 ? [x0, x1] : [x1, x0]
    const [b, t] = y0 <= y1 ? [y0, y1] : [y1, y0]
    return [l, r, t, b]
  }

  protected _get_or_create_canvas(i: number): HTMLCanvasElement {
    const image_data_i = this.image_data[i]
    if (image_data_i != null && image_data_i.width  == this._width[i]
                             && image_data_i.height == this._height[i])
      return image_data_i
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
    dilate: p.Property<boolean>
    origin: p.Property<ImageOrigin>
    anchor: p.Property<Anchor>
  } & Mixins

  export type Mixins = mixins.ImageVector

  export type Visuals = XYGlyph.Visuals & {image: visuals.ImageVector}
}

export interface ImageBase extends ImageBase.Attrs {}

export abstract class ImageBase extends XYGlyph {
  declare properties: ImageBase.Props
  declare __view_type__: ImageBaseView

  constructor(attrs?: Partial<ImageBase.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<ImageBase.Mixins>(mixins.ImageVector)
    this.define<ImageBase.Props>(({Boolean}) => ({
      image:        [ p.NDArraySpec, {field: "image"} ],
      dw:           [ p.DistanceSpec, {field: "dw"} ],
      dh:           [ p.DistanceSpec, {field: "dh"} ],
      dilate:       [ Boolean, false ],
      origin:       [ ImageOrigin, "bottom_left" ],
      anchor:       [ Anchor, "bottom_left" ],
    }))
  }
}
