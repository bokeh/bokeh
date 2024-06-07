import {Plot, PlotView} from "./plot"
import type * as p from "core/properties"

export class FigureView extends PlotView {
  declare model: Figure
}

export namespace Figure {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Plot.Props
}

export interface Figure extends Figure.Attrs {}

export class Figure extends Plot {
  declare properties: Figure.Props
  declare __view_type__: FigureView

  constructor(attrs?: Partial<Figure.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FigureView
  }
}
