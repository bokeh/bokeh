import {PlotCanvas, PlotCanvasView} from "./plot_canvas"
import {Canvas, CanvasView} from "../canvas/canvas"

import {build_view} from "core/build_views"
import {OutputBackend} from "core/enums"
import * as p from "core/properties"
import {BBox} from "core/util/bbox"

export class PlotView extends PlotCanvasView {
  model: Plot

  protected _canvas: Canvas
  protected _canvas_view: CanvasView

  get canvas_view(): CanvasView {
    return this._canvas_view
  }

  protected _outer_bbox: BBox = new BBox()
  protected _inner_bbox: BBox = new BBox()

  initialize(): void {
    super.initialize()
    const {hidpi, output_backend} = this.model
    this._canvas = new Canvas({hidpi, output_backend})
  }

  async lazy_initialize(): Promise<void> {
    this._canvas_view = await build_view(this._canvas, {parent: this})
    this._canvas_view.plot_views = [this]
    await super.lazy_initialize()
  }

  remove(): void {
    this._canvas_view.remove()
    super.remove()
  }

  render(): void {
    super.render()
    this.canvas_view.render()
    this.el.appendChild(this._canvas_view.el)
  }

  _update_layout(): void {
    super._update_layout()
    this.layout.absolute = true
  }

  after_layout(): void {
    super.after_layout()

    if (!this._outer_bbox.equals(this.layout.bbox)) {
      const {width, height} = this.layout.bbox
      this.canvas_view.resize(width, height)
      this._outer_bbox = this.layout.bbox
      this.canvas_view.dirty = true
      this._needs_paint = true
    }

    if (!this._inner_bbox.equals(this.layout.center_panel.inner_bbox)) {
      this._inner_bbox = this.layout.inner_bbox
      this._needs_paint = true
    }

    if (this._needs_paint) {
      // XXX: can't be this.request_paint(), because it would trigger back-and-forth
      // layout recomputing feedback loop between plots. Plots are also much more
      // responsive this way, especially in interactive mode.
      this.canvas_view.repaint()
    }
  }
}

export namespace Plot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PlotCanvas.Props & {
    lod_factor: p.Property<number>
    lod_interval: p.Property<number>
    lod_threshold: p.Property<number>
    lod_timeout: p.Property<number>

    hidpi: p.Property<boolean>
    output_backend: p.Property<OutputBackend>
  }
}

export interface Plot extends Plot.Attrs {}

export class Plot extends PlotCanvas {
  properties: Plot.Props
  __view_type__: PlotView

  use_map?: boolean

  constructor(attrs?: Partial<Plot.Attrs>) {
    super(attrs)
  }

  static init_Plot(): void {
    this.prototype.default_view = PlotView

    this.define<Plot.Props>({
      lod_factor:        [ p.Number,        10       ],
      lod_interval:      [ p.Number,        300      ],
      lod_threshold:     [ p.Number,        2000     ],
      lod_timeout:       [ p.Number,        500      ],

      hidpi:             [ p.Boolean,       true     ],
      output_backend:    [ p.OutputBackend, "canvas" ],
    })
  }

  // TODO: change this when we drop ES5 compatibility (https://github.com/microsoft/TypeScript/issues/338)
  get width(): number | null {
    // const width = super.width
    const width = this.properties.width.get_value()
    return width != null ? width : this.plot_width
  }
  set width(width: number | null) {
    this.setv({width, plot_width: width})
  }

  get height(): number | null {
    // const height = super.height
    const height = this.properties.height.get_value()
    return height != null ? height : this.plot_height
  }
  set height(height: number | null) {
    this.setv({height, plot_height: height})
  }

  protected _doc_attached(): void {
    super._doc_attached()
    this._push_changes([
      [this.properties.inner_height, null, this.inner_height],
      [this.properties.inner_width, null, this.inner_width],
    ])
  }
}
