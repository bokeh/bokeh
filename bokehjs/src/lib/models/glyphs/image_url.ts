import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {Arrayable, Rect, NumberArray} from "core/types"
import {Anchor} from "core/enums"
import * as p from "core/properties"
import {map, minmax} from "core/util/arrayable"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {ImageLoader} from "core/util/image"

export type CanvasImage = HTMLImageElement

export interface ImageURLData extends XYGlyphData {
  _url: string[]
  _angle: NumberArray
  _w: NumberArray
  _h: NumberArray
  _bounds_rect: Rect

  sx: NumberArray
  sy: NumberArray
  sw: NumberArray
  sh: NumberArray

  max_w: number
  max_h: number

  image: (CanvasImage | null)[]
}

export interface ImageURLView extends ImageURLData {}

export class ImageURLView extends XYGlyphView {
  model: ImageURL
  visuals: ImageURL.Visuals

  protected _images_rendered = false

  initialize(): void {
    super.initialize()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      // TODO: add a proper implementation (same as ImageBase?)
      index.add_empty()
    }
  }

  protected _set_data(): void {
    if (this.image == null || this.image.length != this._url.length)
      this.image = map(this._url, () => null)

    const {retry_attempts, retry_timeout} = this.model

    for (let i = 0, end = this._url.length; i < end; i++) {
      const url = this._url[i]

      if (url == null || url == "")
        continue

      new ImageLoader(url, {
        loaded: (image) => {
          this.image[i] = image
          this.renderer.request_render()
        },
        attempts: retry_attempts + 1,
        timeout: retry_timeout,
      })
    }

    const w_data = this.model.properties.w.units == "data"
    const h_data = this.model.properties.h.units == "data"

    const n = this._x.length

    const xs = new NumberArray(w_data ? 2*n : n)
    const ys = new NumberArray(h_data ? 2*n : n)

    const {anchor} = this.model

    function x0x1(x: number, w: number): [number, number] {
      switch (anchor) {
        case "top_left":
        case "bottom_left":
        case "center_left":
          return [x, x + w]
        case "top_center":
        case "bottom_center":
        case "center":
          return [x - w/2, x + w/2]
        case "top_right":
        case "bottom_right":
        case "center_right":
          return [x - w, x]
      }
    }

    function y0y1(y: number, h: number): [number, number] {
      switch (anchor) {
        case "top_left":
        case "top_center":
        case "top_right":
          return [y, y - h]
        case "bottom_left":
        case "bottom_center":
        case "bottom_right":
          return [y + h, y]
        case "center_left":
        case "center":
        case "center_right":
          return [y + h/2, y - h/2]
      }
    }

    // if the width/height are in screen units, don't try to include them in bounds
    if (w_data) {
      for (let i = 0; i < n; i++) {
        [xs[i], xs[n + i]] = x0x1(this._x[i], this._w[i])
      }
    } else
      xs.set(this._x, 0)

    if (h_data) {
      for (let i = 0; i < n; i++) {
        [ys[i], ys[n + i]] = y0y1(this._y[i], this._h[i])
      }
    } else
      ys.set(this._y, 0)

    const [x0, x1] = minmax(xs)
    const [y0, y1] = minmax(ys)

    this._bounds_rect = {x0, x1, y0, y1}
  }

  has_finished(): boolean {
    return super.has_finished() && this._images_rendered == true
  }

  protected _map_data(): void {
    // Better to check this.model.w and this.model.h for null since the set_data
    // machinery will have converted this._w and this._w to lists of null
    const ws = this.model.w != null ? this._w : map(this._x, () => NaN)
    const hs = this.model.h != null ? this._h : map(this._x, () => NaN)

    switch (this.model.properties.w.units) {
      case "data": {
        this.sw = this.sdist(this.renderer.xscale, this._x, ws, "edge", this.model.dilate)
        break
      }
      case "screen": {
        this.sw = ws
        break
      }
    }

    switch (this.model.properties.h.units) {
      case "data": {
        this.sh = this.sdist(this.renderer.yscale, this._y, hs, "edge", this.model.dilate)
        break
      }
      case "screen": {
        this.sh = hs
        break
      }
    }
  }

  protected _render(ctx: Context2d, indices: number[],
                    {image, sx, sy, sw, sh, _angle}: ImageURLData): void {

    // TODO (bev): take actual border width into account when clipping
    const {frame} = this.renderer.plot_view
    ctx.rect(
      frame.bbox.left+1, frame.bbox.top+1,
      frame.bbox.width-2, frame.bbox.height-2,
    )
    ctx.clip()

    let finished = true

    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + _angle[i]))
        continue

      const img = image[i]

      if (img == null) {
        finished = false
        continue
      }

      this._render_image(ctx, i, img, sx, sy, sw, sh, _angle)
    }

    if (finished && !this._images_rendered) {
      this._images_rendered = true
      this.notify_finished()
    }
  }

  protected _final_sx_sy(anchor: Anchor, sx: number, sy: number, sw: number, sh: number): [number, number] {
    switch (anchor) {
      case 'top_left':      return [sx, sy         ]
      case 'top_center':    return [sx - (sw/2), sy         ]
      case 'top_right':     return [sx - sw, sy         ]
      case 'center_right':  return [sx - sw, sy - (sh/2)]
      case 'bottom_right':  return [sx - sw, sy - sh    ]
      case 'bottom_center': return [sx - (sw/2), sy - sh    ]
      case 'bottom_left':   return [sx, sy - sh    ]
      case 'center_left':   return [sx, sy - (sh/2)]
      case 'center':        return [sx - (sw/2), sy - (sh/2)]
    }
  }

  protected _render_image(ctx: Context2d, i: number, image: CanvasImage,
                          sx: Arrayable<number>, sy: Arrayable<number>,
                          sw: Arrayable<number>, sh: Arrayable<number>,
                          angle: Arrayable<number>): void {
    if (isNaN(sw[i])) sw[i] = image.width
    if (isNaN(sh[i])) sh[i] = image.height

    const {anchor} = this.model
    const [sxi, syi] = this._final_sx_sy(anchor, sx[i], sy[i], sw[i], sh[i])

    ctx.save()
    ctx.globalAlpha = this.model.global_alpha
    const sw2 = sw[i]/2
    const sh2 = sh[i]/2

    if (angle[i]) {
      ctx.translate(sxi, syi)

      //rotation about center of image
      ctx.translate(sw2, sh2)
      ctx.rotate(angle[i])
      ctx.translate(-sw2, -sh2)

      ctx.drawImage(image, 0, 0, sw[i], sh[i])

      ctx.translate(sw2, sh2)
      ctx.rotate(-angle[i])
      ctx.translate(-sw2, -sh2)

      ctx.translate(-sxi, -syi)
    } else
      ctx.drawImage(image, sxi, syi, sw[i], sh[i])

    ctx.restore()
  }

  bounds(): Rect {
    return this._bounds_rect
  }
}

export namespace ImageURL {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    url: p.StringSpec
    anchor: p.Property<Anchor>
    global_alpha: p.Property<number>
    angle: p.AngleSpec
    w: p.DistanceSpec
    h: p.DistanceSpec
    dilate: p.Property<boolean>
    retry_attempts: p.Property<number>
    retry_timeout: p.Property<number>
  }

  export type Visuals = XYGlyph.Visuals
}

export interface ImageURL extends ImageURL.Attrs {}

export class ImageURL extends XYGlyph {
  properties: ImageURL.Props
  __view_type__: ImageURLView

  constructor(attrs?: Partial<ImageURL.Attrs>) {
    super(attrs)
  }

  static init_ImageURL(): void {
    this.prototype.default_view = ImageURLView

    this.define<ImageURL.Props>({
      url:            [ p.StringSpec            ],
      anchor:         [ p.Anchor,    'top_left' ],
      global_alpha:   [ p.Number,    1.0        ],
      angle:          [ p.AngleSpec, 0          ],
      w:              [ p.DistanceSpec          ],
      h:              [ p.DistanceSpec          ],
      dilate:         [ p.Boolean,   false      ],
      retry_attempts: [ p.Number,    0          ],
      retry_timeout:  [ p.Number,    0          ],
    })
  }
}
