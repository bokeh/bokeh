import {logger} from "core/logging"

import {GMapPlotCanvas} from "./gmap_plot_canvas"
import {PlotCanvas} from "./plot_canvas"
import {Plot, PlotView} from "./plot"
import * as p from "core/properties"
import {Model} from "../../model"
import {Range1d} from '../ranges/range1d'

export namespace MapOptions {
  export interface Attrs extends Model.Attrs {
    lat: number
    lng: number
    zoom: number
  }

  export interface Props extends Model.Props {
    lat: p.Property<number>
    lng: p.Property<number>
    zoom: p.Property<number>
  }
}

export interface MapOptions extends MapOptions.Attrs {}

export class MapOptions extends Model {

  properties: MapOptions.Props

  constructor(attrs?: Partial<MapOptions.Attrs>) {
    super(attrs)
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
    tilt: number
  }

  export interface Props extends MapOptions.Props {
    map_type: p.Property<string>
    scale_control: p.Property<boolean>
    styles: p.Property<string>
    tilt: p.Property<number>
  }
}

export interface GMapOptions extends GMapOptions.Attrs {}

export class GMapOptions extends MapOptions {

  properties: GMapOptions.Props

  constructor(attrs?: Partial<GMapOptions.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "GMapOptions"

    this.define({
      map_type:      [ p.String, "roadmap" ],
      scale_control: [ p.Bool,   false     ],
      styles:        [ p.String            ],
      tilt:          [ p.Int,    45        ],
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

  export interface Props extends Plot.Props {
    map_options: p.Property<GMapOptions>
    api_key: p.Property<string>
  }
}

export interface GMapPlot extends GMapPlot.Attrs {}

export class GMapPlot extends Plot {

  properties: GMapPlot.Props

  constructor(attrs?: Partial<GMapPlot.Attrs>) {
    super(attrs)
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

    this.override({
      x_range: () => new Range1d(),
      y_range: () => new Range1d(),
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
