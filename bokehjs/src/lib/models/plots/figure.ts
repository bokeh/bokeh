import {Plot, PlotView} from "./plot"
import {SerializableState} from "core/view"
import * as p from "core/properties"

export class FigureView extends PlotView {
  override model: Figure

  // TODO: remove this before bokeh 3.0 and update *.blf files
  override serializable_state(): SerializableState {
    const state = super.serializable_state()
    return {...state, type: "Plot"}
  }
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
