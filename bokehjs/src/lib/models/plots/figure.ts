import {XYPlot} from "./xy_plot"
import {XYPlotView} from "./xy_plot_canvas"
import type * as p from "core/properties"

export class FigureView extends XYPlotView {
  declare model: Figure
}

export namespace Figure {
  export type Attrs = p.AttrsOf<Props>
  export type Props = XYPlot.Props
}

export interface Figure extends Figure.Attrs {}

export class Figure extends XYPlot {
  declare properties: Figure.Props
  declare __view_type__: FigureView

  static {
    this.prototype.default_view = FigureView
  }
}
