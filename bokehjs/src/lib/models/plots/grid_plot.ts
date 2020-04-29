import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {Plot, PlotView} from "./plot"
import {Canvas, CanvasView, CanvasLayer} from "../canvas/canvas"
import {Grid, RowsSizing, ColsSizing} from "core/layout/grid"
import {OutputBackend} from "core/enums"
import {build_view} from "core/build_views"
import {BBox} from "core/util/bbox"
import * as p from "core/properties"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"

export class GridPlotView extends LayoutDOMView {
  model: GridPlot
  layout: Grid
  visuals: Plot.Visuals

  canvas: Canvas
  canvas_view: CanvasView

  protected _outer_bbox: BBox = new BBox()
  protected _needs_paint: boolean = true

  initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this.model) as Plot.Visuals

    this.canvas = new Canvas({
      hidpi: this.model.hidpi,
      output_backend: this.model.output_backend,
    })
  }

  async lazy_initialize(): Promise<void> {
    this.canvas_view = await build_view(this.canvas, {parent: this})
    await super.lazy_initialize()
    this.canvas_view.plot_views = this.child_views as PlotView[]
  }

  remove(): void {
    this.canvas_view.remove()
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): Plot[] {
    return this.model.children.map(([child]) => child)
  }

  _update_layout(): void {
    this.layout = new Grid()
    this.layout.rows = this.model.rows
    this.layout.cols = this.model.cols
    this.layout.spacing = this.model.spacing

    for (const [child, row, col, row_span, col_span] of this.model.children) {
      const child_view = this._child_views[child.id]
      this.layout.items.push({layout: child_view.layout, row, col, row_span, col_span})
    }

    this.layout.set_sizing(this.box_sizing())
  }

  after_layout(): void {
    super.after_layout()

    if (!this._outer_bbox.equals(this.layout.bbox)) {
      const {width, height} = this.layout.bbox
      this.canvas_view.resize(width, height)
      this._outer_bbox = this.layout.bbox
      this._needs_paint = true
    }

    if (this._needs_paint) {
      this._needs_paint = false
      this.canvas_view.repaint()
    }
  }

  render(): void {
    super.render()
    this.canvas_view.render()
    this.el.appendChild(this.canvas_view.el)
  }

  paint(): void {
    const {ctx} = this.layer

    const {x, y, width, height} = this.layout.bbox
    ctx.clearRect(x, y, width, height)

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      ctx.fillRect(x, y, width, height)
    }
  }

  get layer(): CanvasLayer {
    return this.canvas_view.primary
  }
}

export namespace GridPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    children: p.Property<[Plot, number, number, number?, number?][]>
    rows: p.Property<RowsSizing>
    cols: p.Property<ColsSizing>
    spacing: p.Property<number | [number, number]>
    hidpi: p.Property<boolean>
    output_backend: p.Property<OutputBackend>
  } & mixins.BackgroundFill

  export type Visuals = visuals.Visuals & {
    background_fill: visuals.Fill
  }
}

export interface GridPlot extends GridPlot.Attrs {}

export class GridPlot extends LayoutDOM {
  properties: GridPlot.Props

  constructor(attrs?: Partial<GridPlot.Attrs>) {
    super(attrs)
  }

  static init_GridPlot(): void {
    this.prototype.default_view = GridPlotView

    this.mixins(["fill:background_"])

    this.define<GridPlot.Props>({
      children:       [ p.Array,         []       ],
      rows:           [ p.Any,           "auto"   ],
      cols:           [ p.Any,           "auto"   ],
      spacing:        [ p.Any,            0       ],
      hidpi:          [ p.Boolean,       true     ],
      output_backend: [ p.OutputBackend, "canvas" ],
    })
  }
}
