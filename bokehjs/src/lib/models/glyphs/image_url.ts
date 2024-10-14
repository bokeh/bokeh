import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {inherit} from "./glyph"
import type {Arrayable, Rect} from "core/types"
import {ScreenArray, to_screen, Indices} from "core/types"
import {Anchor} from "core/enums"
import * as p from "core/properties"
import {resize} from "core/util/array"
import {minmax2} from "core/util/arrayable"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import {ImageLoader} from "core/util/image"
import type {XY} from "core/util/bbox"
import * as resolve from "../common/resolve"

export type CanvasImage = HTMLImageElement

export interface ImageURLView extends ImageURL.Data {}

export class ImageURLView extends XYGlyphView {
  declare model: ImageURL
  declare visuals: ImageURL.Visuals

  protected _images_rendered = false
  protected _bounds_rect: Rect

  anchor: XY<number>

  /*protected*/ image: (CanvasImage | null)[] = new Array(0)
  loaders: (ImageLoader | null)[]
  protected resolved: Indices

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_paint())
  }

  protected override _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      // TODO: add a proper implementation (same as ImageBase?)
      index.add_empty()
    }
  }

  private _set_data_iteration: number = 0

  protected override _set_data(): void {
    if (this.inherited_url) {
      this._images_rendered = true
      return
    }

    this._set_data_iteration++

    const {url} = this
    const n_url = url.length

    this.image = resize(this.image, n_url, null)
    this.loaders = new Array(n_url).fill(null)
    this.resolved = new Indices(n_url)

    const {retry_attempts, retry_timeout} = this.model
    const {_set_data_iteration} = this

    for (let i = 0; i < n_url; i++) {
      const url_i = url.get(i)
      if (url_i == "") {
        continue
      }

      const loader = new ImageLoader(url_i, {
        loaded: (image_i) => {
          if (this._set_data_iteration == _set_data_iteration && !this.resolved.get(i)) {
            this.resolved.set(i)
            this.image[i] = image_i
            this.loaders[i] = null
            this.renderer.request_paint()
          }
        },
        failed: () => {
          if (this._set_data_iteration == _set_data_iteration) {
            this.resolved.set(i)
            this.loaders[i] = null
            const image_i = this.image[i]
            if (image_i != null) {
              this.image[i] = null
              this.renderer.request_paint()
            }
          }
        },
        attempts: retry_attempts + 1,
        timeout: retry_timeout,
      })
      this.loaders[i] = loader
    }

    const w_data = this.model.properties.w.units == "data"
    const h_data = this.model.properties.h.units == "data"

    const n = this.data_size

    const xs = new ScreenArray(w_data ? 2*n : n)
    const ys = new ScreenArray(h_data ? 2*n : n)

    this.anchor = resolve.anchor(this.model.anchor)
    const {x: x_anchor, y: y_anchor} = this.anchor

    function x0x1(x: number, w: number) {
      const x0 = x - x_anchor*w
      return [x0, x0 + w]
    }
    function y0y1(y: number, h: number) {
      const y0 = y + y_anchor*h
      return [y0, y0 - h]
    }

    // if the width/height are in screen units, don't try to include them in bounds
    if (w_data) {
      for (let i = 0; i < n; i++) {
        [xs[i], xs[n + i]] = x0x1(this.x[i], this.w.get(i) ?? 0)
      }
    } else {
      xs.set(this.x, 0)
    }

    if (h_data) {
      for (let i = 0; i < n; i++) {
        [ys[i], ys[n + i]] = y0y1(this.y[i], this.h.get(i) ?? 0)
      }
    } else {
      ys.set(this.y, 0)
    }

    const [x0, x1, y0, y1] = minmax2(xs, ys)
    this._bounds_rect = {x0, x1, y0, y1}
  }

  override has_finished(): boolean {
    return super.has_finished() && this._images_rendered
  }

  protected override _map_data(): void {
    const w = () => this.w.map((w_i) => w_i ?? NaN)
    const h = () => this.h.map((h_i) => h_i ?? NaN)

    this._define_or_inherit_attr<ImageURL.Data>("sw", () => {
      if (this.model.properties.w.units == "data") {
        if (this.inherited_x && this.inherited_w) {
          return inherit
        } else {
          return this.sdist(this.renderer.xscale, this.x, w(), "edge", this.model.dilate)
        }
      } else {
        return this.inherited_w ? inherit : to_screen(w())
      }
    })

    this._define_or_inherit_attr<ImageURL.Data>("sh", () => {
      if (this.model.properties.h.units == "data") {
        if (this.inherited_y && this.inherited_h) {
          return inherit
        } else {
          return this.sdist(this.renderer.yscale, this.y, h(), "edge", this.model.dilate)
        }
      } else {
        return this.inherited_h ? inherit : to_screen(h())
      }
    })
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<ImageURL.Data>): void {
    const {sx, sy, sw, sh, angle, global_alpha} = {...this, ...data}
    const {image, loaders, resolved} = this

    // TODO (bev): take actual border width into account when clipping
    const {frame} = this.renderer.plot_view
    const {left, top, width, height} = frame.bbox
    ctx.beginPath()
    ctx.rect(left + 1, top + 1, width - 2, height - 2)
    ctx.clip()

    let finished = true

    for (const i of indices) {
      const loader_i = loaders[i]

      if (!isFinite(sx[i] + sy[i] + angle.get(i) + global_alpha.get(i))) {
        continue
      }

      if (!resolved.get(i)) {
        if (loader_i != null && loader_i.image.complete) {
          image[i] = loader_i.image
          loaders[i] = null
          resolved.set(i)
        } else {
          finished = false
        }
      }

      const image_i = image[i]
      if (image_i == null) {
        continue
      }
      if (image_i.naturalWidth == 0 && image_i.naturalHeight == 0) { // dumb way of detecting broken images
        continue
      }

      this._render_image(ctx, i, image_i, sx, sy, sw, sh, angle, global_alpha)
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
    if (!isFinite(sw[i])) {
      sw[i] = image.width
    }
    if (!isFinite(sh[i])) {
      sh[i] = image.height
    }

    const sw_i = sw[i]
    const sh_i = sh[i]

    const {anchor} = this
    const dx_i = anchor.x*sw_i
    const dy_i = anchor.y*sh_i

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
    } else {
      ctx.drawImage(image, sx_i, sy_i, sw_i, sh_i)
    }

    ctx.restore()
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

  export type Data = p.GlyphDataOf<Props>
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

    this.define<ImageURL.Props>(({Bool, Int}) => ({
      url:            [ p.StringSpec, {field: "url"} ],
      anchor:         [ Anchor, "top_left" ],
      global_alpha:   [ p.NumberSpec, {value: 1.0} ],
      angle:          [ p.AngleSpec, 0 ],
      w:              [ p.NullDistanceSpec, null ],
      h:              [ p.NullDistanceSpec, null ],
      dilate:         [ Bool, false ],
      retry_attempts: [ Int, 0 ],
      retry_timeout:  [ Int, 0 ],
    }))
  }
}
