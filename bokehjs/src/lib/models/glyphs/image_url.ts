import type {XYGlyphData} from "./xy_glyph"
import {XYGlyph, XYGlyphView} from "./xy_glyph"
import type {Arrayable, Rect} from "core/types"
import {ScreenArray, to_screen, Indices} from "core/types"
import {Anchor} from "core/enums"
import * as p from "core/properties"
import {minmax} from "core/util/arrayable"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import {ImageLoader} from "core/util/image"
import type {XY} from "core/util/bbox"
import * as resolve from "../common/resolve"

export type CanvasImage = HTMLImageElement

export type ImageURLData = XYGlyphData & {
  readonly url: p.Uniform<string>
  readonly angle: p.Uniform<number>
  readonly w: p.Uniform<number>
  readonly h: p.Uniform<number>
  readonly global_alpha: p.Uniform<number>

  _bounds_rect: Rect

  sw: ScreenArray
  sh: ScreenArray

  readonly max_w: number
  readonly max_h: number

  image: (CanvasImage | undefined)[]
  rendered: Indices
}

export interface ImageURLView extends ImageURLData {}

export class ImageURLView extends XYGlyphView {
  declare model: ImageURL
  declare visuals: ImageURL.Visuals

  protected _images_rendered = false

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  protected override _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const [l, r, t, b] = this._lrtb(i)
      index.add_rect(l, b, r, t)
    }
  }

  _lrtb(i: number): [number, number, number, number] {
    const dw_i = this.w.get(i)
    const dh_i = this.h.get(i)

    const x_i = this._x[i]
    const y_i = this._y[i]

    const {xy_anchor} = this

    const [x0, x1] = [x_i - xy_anchor.x*dw_i, x_i + (1 - xy_anchor.x)*dw_i]
    const [y0, y1] = [y_i + xy_anchor.y*dh_i, y_i - (1 - xy_anchor.y)*dh_i]

    const [l, r] = x0 <= x1 ? [x0, x1] : [x1, x0]
    const [b, t] = y0 <= y1 ? [y0, y1] : [y1, y0]
    return [l, r, t, b]
  }

  private _xy_anchor: XY<number>
  get xy_anchor(): XY<number> {
    return this._xy_anchor
  }

  private _set_data_iteration: number = 0

  protected override _set_data(): void {
    // TODO: cache by url, to reuse images between iterations
    this._set_data_iteration++

    const n_urls = this.url.length
    this.image = new Array(n_urls)
    this.rendered = new Indices(n_urls)

    const {retry_attempts, retry_timeout} = this.model
    const {_set_data_iteration} = this

    for (let i = 0; i < n_urls; i++) {
      const url = this.url.get(i)
      if (url == "")
        continue

      const loader = new ImageLoader(url, {
        loaded: () => {
          if (this._set_data_iteration == _set_data_iteration && !this.rendered.get(i)) {
            this.renderer.request_render()
          }
        },
        failed: () => {
          if (this._set_data_iteration == _set_data_iteration) {
            this.image[i] = undefined
          }
        },
        attempts: retry_attempts + 1,
        timeout: retry_timeout,
      })
      this.image[i] = loader.image
    }

    const w_data = this.model.properties.w.units == "data"
    const h_data = this.model.properties.h.units == "data"

    const n = this.data_size

    const xs = new ScreenArray(w_data ? 2*n : n)
    const ys = new ScreenArray(h_data ? 2*n : n)

    this._xy_anchor = resolve.anchor(this.model.anchor)
    const {xy_anchor} = this

    function x0x1(x: number, w: number) {
      const x0 = x - xy_anchor.x*w
      return [x0, x0 + w]
    }
    function y0y1(y: number, h: number) {
      const y0 = y + xy_anchor.y*h
      return [y0, y0 - h]
    }

    // if the width/height are in screen units, don't try to include them in bounds
    if (w_data) {
      for (let i = 0; i < n; i++) {
        [xs[i], xs[n + i]] = x0x1(this._x[i], this.w.get(i))
      }
    } else
      xs.set(this._x, 0)

    if (h_data) {
      for (let i = 0; i < n; i++) {
        [ys[i], ys[n + i]] = y0y1(this._y[i], this.h.get(i))
      }
    } else
      ys.set(this._y, 0)

    const [x0, x1] = minmax(xs)
    const [y0, y1] = minmax(ys)

    this._bounds_rect = {x0, x1, y0, y1}
  }

  override has_finished(): boolean {
    return super.has_finished() && this._images_rendered
  }

  protected override _map_data(): void {
    if (this.model.properties.w.units == "data")
      this.sw = this.sdist(this.renderer.xscale, this._x, this.w, "edge", this.model.dilate)
    else
      this.sw = to_screen(this.w)

    if (this.model.properties.h.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this.h, "edge", this.model.dilate)
    else
      this.sh = to_screen(this.h)
  }

  protected _render(ctx: Context2d, indices: number[], data?: ImageURLData): void {
    const {image, sx, sy, sw, sh, angle, global_alpha} = data ?? this

    // TODO (bev): take actual border width into account when clipping
    const {frame} = this.renderer.plot_view
    const {left, top, width, height} = frame.bbox
    ctx.beginPath()
    ctx.rect(left + 1, top + 1, width - 2, height - 2)
    ctx.clip()

    let finished = true

    for (const i of indices) {
      const img = image[i]

      if (!isFinite(sx[i] + sy[i] + angle.get(i) + global_alpha.get(i)) || img == null)
        continue

      if (!img.complete) {
        finished = false
        continue
      } else if (img.naturalWidth == 0 && img.naturalHeight == 0) { // dumb way of detecting broken images
        continue
      }

      this._render_image(ctx, i, img, sx, sy, sw, sh, angle, global_alpha)
    }

    if (finished && !this._images_rendered) {
      this._images_rendered = true
      this.notify_finished()
    }
  }

  protected _render_image(ctx: Context2d, i: number, image: CanvasImage,
                          sx: Arrayable<number>, sy: Arrayable<number>,
                          sw: Arrayable<number>, sh: Arrayable<number>,
                          angle: p.Uniform<number>, alpha: p.Uniform<number>): void {
    if (!isFinite(sw[i])) sw[i] = image.width
    if (!isFinite(sh[i])) sh[i] = image.height

    const sw_i = sw[i]
    const sh_i = sh[i]

    const {xy_anchor} = this
    const dx_i = xy_anchor.x*sw_i
    const dy_i = xy_anchor.y*sh_i

    const sx_i = sx[i] - dx_i
    const sy_i = sy[i] - dy_i

    const angle_i = angle.get(i)
    const alpha_i = alpha.get(i)

    ctx.save()
    ctx.globalAlpha = alpha_i
    const sw2 = sw_i/2
    const sh2 = sh_i/2

    if (angle_i != 0) {
      ctx.translate(sx_i, sy_i)

      //rotation about center of image
      ctx.translate(sw2, sh2)
      ctx.rotate(angle_i)
      ctx.translate(-sw2, -sh2)

      ctx.drawImage(image, 0, 0, sw_i, sh_i)

      ctx.translate(sw2, sh2)
      ctx.rotate(-angle_i)
      ctx.translate(-sw2, -sh2)

      ctx.translate(-sx_i, -sy_i)
    } else
      ctx.drawImage(image, sx_i, sy_i, sw_i, sh_i)

    ctx.restore()

    this.rendered.set(i)
  }

  override bounds(): Rect {
    return this._bounds_rect
  }
}

export namespace ImageURL {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    url: p.StringSpec
    anchor: p.Property<Anchor>
    global_alpha: p.NumberSpec
    angle: p.AngleSpec
    w: p.NullDistanceSpec
    h: p.NullDistanceSpec
    dilate: p.Property<boolean>
    retry_attempts: p.Property<number>
    retry_timeout: p.Property<number>
  }

  export type Visuals = XYGlyph.Visuals
}

export interface ImageURL extends ImageURL.Attrs {}

export class ImageURL extends XYGlyph {
  declare properties: ImageURL.Props
  declare __view_type__: ImageURLView

  constructor(attrs?: Partial<ImageURL.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ImageURLView

    this.define<ImageURL.Props>(({Boolean, Int}) => ({
      url:            [ p.StringSpec, {field: "url"} ],
      anchor:         [ Anchor, "top_left" ],
      global_alpha:   [ p.NumberSpec, {value: 1.0} ],
      angle:          [ p.AngleSpec, 0 ],
      w:              [ p.NullDistanceSpec, null ],
      h:              [ p.NullDistanceSpec, null ],
      dilate:         [ Boolean, false ],
      retry_attempts: [ Int, 0 ],
      retry_timeout:  [ Int, 0 ],
    }))
  }
}
