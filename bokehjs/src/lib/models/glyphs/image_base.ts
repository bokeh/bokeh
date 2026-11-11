import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {inherit} from "./glyph"
import type {Arrayable} from "core/types"
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
import {is_NDArray} from "core/util/ndarray"
import {assert_not_null} from "core/util/assert"
import {logger} from "core/logging"
import type {XY} from "core/util/bbox"
import {Anchor} from "../common/kinds"
import {anchor} from "../common/resolve"
import {LogScale} from "../scales/log_scale"

type ImageData = HTMLCanvasElement | null

export interface ImageBaseView extends ImageBase.Data {}

export abstract class ImageBaseView extends XYGlyphView {
  declare model: ImageBase
  declare visuals: ImageBase.Visuals

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_paint())
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

  protected _paint(ctx: Context2d, indices: Int32Array, data?: Partial<ImageBase.Data>): void {
    const {image_data, sx, sy, sdw, sdh} = {...this, ...data}
    const {xy_sign, xy_scale, xy_offset, xy_anchor} = this

    assert_not_null(image_data)

    ctx.save()
    ctx.imageSmoothingEnabled = false

    if (this.visuals.image.doit) {
      for (const i of indices) {
        const image_data_i = image_data[i]
        const sx_i = sx[i]
        const sy_i = sy[i]
        const sdw_i = sdw[i]
        const sdh_i = sdh[i]

        if (image_data_i == null || !isFinite(sx_i + sy_i + sdw_i + sdh_i)) {
          continue
        }

        const tx_i = xy_sign.x*xy_anchor.x*sdw_i
        const ty_i = xy_sign.y*xy_anchor.y*sdh_i

        ctx.save()
        ctx.translate(sx_i - tx_i, sy_i - ty_i)
        ctx.scale(xy_sign.x*xy_scale.x, xy_sign.y*xy_scale.y)
        this.visuals.image.set_vectorize(ctx, i)
        ctx.drawImage(image_data_i, -xy_offset.x*sdw_i, -xy_offset.y*sdh_i, sdw_i, sdh_i)
        ctx.restore()
      }
    }

    ctx.restore()
  }

  protected abstract _flat_img_to_buf8(img: NDArrayType<number>): Uint8ClampedArray

  protected get _can_inherit_image_data(): boolean {
    return this.inherited_image
  }

  protected override _set_data(indices: number[] | null): void {
    const n = this.data_size

    if (!this._can_inherit_image_data) {
      let {image_data} = this
      if (image_data?.length != n) {
        image_data = new Array(n).fill(null)
        this._define_attr<ImageBase.Data>("image_data", image_data)
      }

      const {image_dimension} = this

      for (let i = 0; i < n; i++) {
        if (indices != null && !indices.includes(i)) {
          continue
        }

        const img = this.image.get(i)

        if (!is_NDArray(img) || img.dimension != image_dimension) {
          const got = is_NDArray(img) ? `${img.dimension}D array` : typeof img
          logger.error(`${this.model}.image[${i}]: expected a ${image_dimension}D array, got ${got}`)
          // don't keep rendering a stale image from a previous update
          image_data[i] = null
          continue
        }

        const [height, width] = img.shape
        if (width == 0 || height == 0) {
          // nothing to render and a zero sized canvas can't be drawn
          image_data[i] = null
          continue
        }

        const buf8 = this._flat_img_to_buf8(img)
        image_data[i] = this._image_from_buffer(image_data[i], width, height, buf8)
      }
    } else {
      this._inherit_attr<ImageBase.Data>("image_data")
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

    const x_i = this.x[i]
    const y_i = this.y[i]

    const {xy_anchor} = this

    const [x0, x1] = [x_i - xy_anchor.x*dw_i, x_i + (1 - xy_anchor.x)*dw_i]
    const [y0, y1] = [y_i + xy_anchor.y*dh_i, y_i - (1 - xy_anchor.y)*dh_i]

    const [l, r] = x0 <= x1 ? [x0, x1] : [x1, x0]
    const [b, t] = y0 <= y1 ? [y0, y1] : [y1, y0]
    return [l, r, t, b]
  }

  protected _get_or_create_canvas(prev: ImageData, width: number, height: number): HTMLCanvasElement {
    if (prev != null && prev.width == width && prev.height == height) {
      return prev
    } else {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      return canvas
    }
  }

  protected _image_from_buffer(prev: ImageData, width: number, height: number, buf8: Uint8ClampedArray): HTMLCanvasElement {
    // This creates a software 2D canvas, which is good for frequent getImageData() and
    // putImageData(), but not for general rendering due to lack of hardware acceleration.
    const canvas = this._get_or_create_canvas(prev, width, height)
    const ctx = canvas.getContext("2d", {willReadFrequently: true})
    assert_not_null(ctx)
    const image_data = ctx.getImageData(0, 0, width, height)
    image_data.data.set(buf8)
    ctx.putImageData(image_data, 0, 0)
    return canvas
  }

  protected override _map_data(): void {
    this._define_or_inherit_attr<ImageBase.Data>("sdw", () => {
      if (this.model.properties.dw.units == "data") {
        if (this.inherited_x && this.inherited_dw) {
          return inherit
        } else {
          return this.sdist(this.renderer.xscale, this.x, this.dw, "edge", this.model.dilate)
        }
      } else {
        return this.inherited_dw ? inherit : to_screen(this.dw)
      }
    })

    this._define_or_inherit_attr<ImageBase.Data>("sdh", () => {
      if (this.model.properties.dh.units == "data") {
        if (this.inherited_y && this.inherited_dh) {
          return inherit
        } else {
          return this.sdist(this.renderer.yscale, this.y, this.dh, "edge", this.model.dilate)
        }
      } else {
        return this.inherited_dh ? inherit : to_screen(this.dh)
      }
    })
  }

  protected _image_index(index: number, x: number, y: number): ImageIndex {
    const [l, r, t, b] = this._lrtb(index)
    const canvas = this.image_data?.[index]
    assert_not_null(canvas)
    const {width, height} = canvas

    // The handling of log scales here assumes that users themselves have
    // generated images that are "pre-transformed", e.g. an np.meshgrid where
    // np.logspace was used for one or both inputs. Bokeh images always assume
    // square pixels and do not do any sort of transformation on the canvas

    const dx = (() => {
      if (this.renderer.xscale instanceof LogScale) {
        return Math.log(x/l) / Math.log(r/l)
      }
      return (x-l) / (r-l)
    })()

    const dy = (() => {
      if (this.renderer.yscale instanceof LogScale) {
        return Math.log(y/b) / Math.log(t/b)
      }
      return (y-b) / (t-b)
    })()

    const i = Math.floor(dx*width)
    const j = Math.floor(dy*height)

    return {index, i, j, flat_index: j*width + i}
  }

  override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({x0: x, x1: x, y0: y, y1: y})
    const result = Selection.create()

    const {image_data} = this
    assert_not_null(image_data)

    const indices = []
    for (const index of candidates) {
      // skipped (invalid or empty) images have no pixels to hit
      if (image_data[index] == null) {
        continue
      }
      if (isFinite(sx) && isFinite(sy)) {
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

  export type Data = p.GlyphDataOf<Props> & {
    image_data: Arrayable<ImageData> | undefined
    inherited_image_data: boolean
  }
}

export interface ImageBase extends ImageBase.Attrs {}

export abstract class ImageBase extends XYGlyph {
  declare properties: ImageBase.Props
  declare __view_type__: ImageBaseView

  static {
    this.mixins<ImageBase.Mixins>(mixins.ImageVector)
    this.define<ImageBase.Props>(({Bool}) => ({
      image:        [ p.NDArraySpec, {field: "image"} ],
      dw:           [ p.DistanceSpec, {field: "dw"} ],
      dh:           [ p.DistanceSpec, {field: "dh"} ],
      dilate:       [ Bool, false ],
      origin:       [ ImageOrigin, "bottom_left" ],
      anchor:       [ Anchor, "bottom_left" ],
    }))
  }
}
