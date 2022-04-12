import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {Arrayable, Rect, ScreenArray, to_screen, Indices} from "core/types"
import {Anchor} from "core/enums"
import * as p from "core/properties"
import {minmax} from "core/util/arrayable"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {ImageLoader} from "core/util/image"

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
  override model: ImageURL
  override visuals: ImageURL.Visuals

  protected _images_rendered = false

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
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
    // TODO: cache by url, to reuse images between iterations
    this._set_data_iteration++

    const n_urls = this.url.length
    this.image = new Array(n_urls)
    this.rendered = new Indices(n_urls)

    const {retry_attempts, retry_timeout} = this.model
    const {_set_data_iteration} = this

    for (let i = 0; i < n_urls; i++) {
      const url = this.url.get(i)
      if (!url)
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

    const n = this._x.length

    const xs = new ScreenArray(w_data ? 2*n : n)
    const ys = new ScreenArray(h_data ? 2*n : n)

    const {anchor} = this.model

    function x0x1(x: number, w: number): [number, number] {
      switch (anchor) {
        case "top_left":
        case "bottom_left":
        case "left":
        case "center_left":
          return [x, x + w]
        case "top":
        case "top_center":
        case "bottom":
        case "bottom_center":
        case "center":
        case "center_center":
          return [x - w/2, x + w/2]
        case "top_right":
        case "bottom_right":
        case "right":
        case "center_right":
          return [x - w, x]
      }
    }

    function y0y1(y: number, h: number): [number, number] {
      switch (anchor) {
        case "top_left":
        case "top":
        case "top_center":
        case "top_right":
          return [y, y - h]
        case "bottom_left":
        case "bottom":
        case "bottom_center":
        case "bottom_right":
          return [y + h, y]
        case "left":
        case "center_left":
        case "center":
        case "center_center":
        case "right":
        case "center_right":
          return [y + h/2, y - h/2]
      }
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
    const {bbox} = this.renderer.parent
    const {left, top, width, height} = bbox
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

  protected _final_sx_sy(anchor: Anchor, sx: number, sy: number, sw: number, sh: number): [number, number] {
    switch (anchor) {
      case "top_left":      return [sx, sy         ]
      case "top":
      case "top_center":    return [sx - (sw/2), sy         ]
      case "top_right":     return [sx - sw, sy         ]
      case "right":
      case "center_right":  return [sx - sw, sy - (sh/2)]
      case "bottom_right":  return [sx - sw, sy - sh    ]
      case "bottom":
      case "bottom_center": return [sx - (sw/2), sy - sh    ]
      case "bottom_left":   return [sx, sy - sh    ]
      case "left":
      case "center_left":   return [sx, sy - (sh/2)]
      case "center":
      case "center_center": return [sx - (sw/2), sy - (sh/2)]
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

    const {anchor} = this.model
    const [sx_i, sy_i] = this._final_sx_sy(anchor, sx[i], sy[i], sw_i, sh_i)

    const angle_i = angle.get(i)
    const alpha_i = alpha.get(i)

    ctx.save()
    ctx.globalAlpha = alpha_i
    const sw2 = sw_i/2
    const sh2 = sh_i/2

    if (angle_i) {
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
  override properties: ImageURL.Props
  override __view_type__: ImageURLView

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
