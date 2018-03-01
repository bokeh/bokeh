import {logger} from "core/logging"

import {GMapPlotCanvas} from "./gmap_plot_canvas"
import {PlotCanvas} from "./plot_canvas"
import {Plot, PlotView} from "./plot"
import * as p from "core/properties"
import {Model} from "../../model"

export namespace MapOptions {
  export interface Attrs extends Model.Attrs {
    lat: number
    lng: number
    zoom: number
  }

  export interface Opts extends Model.Opts {}
}

export interface MapOptions extends MapOptions.Attrs {}

export class MapOptions extends Model {

  constructor(attrs?: Partial<MapOptions.Attrs>, opts?: MapOptions.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "MapOptions"

    this.define({
      lat:  [ p.Number     ],
      lng:  [ p.Number     ],
      zoom: [ p.Number, 12 ],
    })
  }
}
MapOptions.initClass()

export namespace GMapOptions {
  export interface Attrs extends MapOptions.Attrs {
    map_type: string
    scale_control: boolean
    styles: string
  }

  export interface Opts extends MapOptions.Opts {}
}

export interface GMapOptions extends GMapOptions.Attrs {}

export class GMapOptions extends MapOptions {

  constructor(attrs?: Partial<GMapOptions.Attrs>, opts?: GMapOptions.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "GMapOptions"

    this.define({
      map_type:      [ p.String, "roadmap" ],
      scale_control: [ p.Bool,   false     ],
      styles:        [ p.String            ],
    })
  }
}
GMapOptions.initClass()

export class GMapPlotView extends PlotView {
  model: GMapPlot
}

export namespace GMapPlot {
  export interface Attrs extends Plot.Attrs {
    map_options: GMapOptions
    api_key: string
  }

  export interface Opts extends Plot.Opts {}
}

export interface GMapPlot extends GMapPlot.Attrs {}

export class GMapPlot extends Plot {

  constructor(attrs?: Partial<GMapPlot.Attrs>, opts?: GMapPlot.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "GMapPlot"
    this.prototype.default_view = GMapPlotView

    // Set all the PlotCanvas properties as internal.
    // This seems to be necessary so that everything can initialize.
    // Feels very clumsy, but I'm not sure how the properties system wants
    // to handle something like this situation.
    this.define({
      map_options: [ p.Instance ],
      api_key:     [ p.String   ],
    })
  }

  initialize(): void {
    super.initialize()
    if (!this.api_key)
      logger.error("api_key is required. See https://developers.google.com/maps/documentation/javascript/get-api-key for more information on how to obtain your own.")
  }

  protected _init_plot_canvas(): PlotCanvas {
    return new GMapPlotCanvas({plot: this})
  }
}
GMapPlot.initClass()
