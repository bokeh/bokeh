import {Plot, PlotView} from "./plot"
import * as p from "core/properties"

export class FigureView extends PlotView {
  override model: Figure
}

export namespace Figure {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Plot.Props
}

export interface Figure extends Figure.Attrs {}

export class Figure extends Plot {
  override properties: Figure.Props
  override __view_type__: FigureView

  constructor(attrs?: Partial<Figure.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FigureView
  }
}
