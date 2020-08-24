import {Renderer, RendererView} from "models/renderers/renderer"
import {LinearColorMapper} from "models/mappers/linear_color_mapper"
import {Scale} from "models/scales/scale"
import {Color} from "core/types"
import {canvas} from "core/dom"
import * as p from "core/properties"

export class WaterfallRendererView extends RendererView {
  model: WaterfallRenderer

  private canvas: HTMLCanvasElement[]
  private image: Uint32Array[]
  private x: number[]
  private col: number
  private tile: number
  private cmap: LinearColorMapper
  private xscale: Scale
  private yscale: Scale
  private max_freq: number

  initialize(): void {
    super.initialize()

    const N = Math.ceil(this.model.num_grams/this.model.tile_width) + 1
    const [w, h] = [this.model.tile_width, this.model.gram_length]

    this.canvas = []
    this.image = []
    for (let i = 0; i < N; i++) {
      this.canvas.push(canvas({width: w, height: h}))
      this.image.push(new Uint32Array(w*h))
    }

    this.x = new Array(N)
    for (let i = 0; i < N; i++)
      this.x[i] = -this.model.num_grams + this.model.tile_width*(i-1)

    this.col = 0
    this.tile = 0
    this.cmap = new LinearColorMapper({palette: this.model.palette, low: 0, high: 5})
    this.xscale = this.plot_view.frame.x_scale
    this.yscale = this.plot_view.frame.y_scale
    this.max_freq = this.plot_view.frame.y_range.end
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, this.request_render)
  }

  protected _render(): void {
    const {ctx} = this.layer
    ctx.save()

    const smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    this._update_tiles()

    const sx = this.xscale.v_compute(this.x)
    const sy = this.yscale.compute(0)
    const sw = Math.ceil(this.xscale.compute(this.model.tile_width) - this.xscale.compute(0))
    const sh = Math.ceil(this.yscale.compute(0) - this.yscale.compute(this.max_freq))

    ctx.translate(0, sy)
    ctx.scale(1, -1)
    ctx.translate(0, -sy)

    for (let i = 0; i < sx.length; i++)
      ctx.drawImage(this.canvas[i], sx[i], sy, sw, sh)

    ctx.translate(0, sy)
    ctx.scale(1, -1)
    ctx.translate(0, -sy)

    ctx.setImageSmoothingEnabled(smoothing)

    ctx.restore()
  }

  _update_tiles(): void {
    // shift all tiles to the right by one
    for (let i = 0; i < this.x.length; i++)
      this.x[i] += 1

    // if we've updated the last column in the current tile, move to the next tile
    // in the buffer (rotating the buffer if necessary)
    this.col -= 1
    if (this.col < 0) {
      this.col = this.model.tile_width - 1
      this.tile -= 1
      if (this.tile < 0)
        this.tile = this.x.length - 1
      this.x[this.tile] = -this.model.tile_width
    }

    // apply the lastest column to the current tile image
    const buf32 = new Uint32Array(this.cmap.rgba_mapper.v_compute(this.model.latest).buffer)
    for (let i = 0; i < this.model.gram_length; i++)
      this.image[this.tile][i*this.model.tile_width+this.col] = buf32[i]

    // update the tiles canvas with the image data
    const cctx = this.canvas[this.tile].getContext('2d')!
    const image = cctx.getImageData(0, 0, this.model.tile_width, this.model.gram_length)
    image.data.set(new Uint8Array(this.image[this.tile].buffer))
    cctx.putImageData(image, 0, 0)
  }
}

export namespace WaterfallRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props & {
    latest:      p.Property<number[]>
    palette:     p.Property<Color[]>
    num_grams:   p.Property<number>
    gram_length: p.Property<number>
    tile_width:  p.Property<number>
  }
}

export interface WaterfallRenderer extends WaterfallRenderer.Attrs {}

export class WaterfallRenderer extends Renderer {
  properties: WaterfallRenderer.Props
  __view_type__: WaterfallRendererView

  constructor(attrs?: Partial<WaterfallRenderer.Attrs>) {
    super(attrs)
  }

  static init_WaterfallRenderer(): void {
    this.prototype.default_view = WaterfallRendererView

    this.define<WaterfallRenderer.Props>({
      latest:      [ p.Any ],
      palette:     [ p.Any ],
      num_grams:   [ p.Int ],
      gram_length: [ p.Int ],
      tile_width:  [ p.Int ],
    })

    this.override({
      level: "glyph",
    })
  }
}
