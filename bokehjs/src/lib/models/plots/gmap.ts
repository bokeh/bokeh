import {GMapPlot, GMapPlotView} from "./gmap_plot"
import type {SerializableState} from "core/view"
import type * as p from "core/properties"

export class GMapView extends GMapPlotView {
  declare model: GMap

  // TODO: remove this before bokeh 3.0 and update *.blf files
  override serializable_state(): SerializableState {
    const state = super.serializable_state()
    return {...state, type: "GMapPlot"}
  }
}

export namespace GMap {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GMapPlot.Props
}

export interface GMap extends GMap.Attrs {}

export class GMap extends GMapPlot {
  declare properties: GMap.Props
  declare __view_type__: GMapView

  constructor(attrs?: Partial<GMap.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GMapView
  }
}
