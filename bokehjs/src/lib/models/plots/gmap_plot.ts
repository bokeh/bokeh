import {logger} from "core/logging"

import {Plot} from "./plot"
import * as p from "core/properties"
import {Model} from "../../model"
import {Range1d} from '../ranges/range1d'

import {GMapPlotView} from "./gmap_plot_canvas"
export {GMapPlotView}

export namespace MapOptions {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
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
    this.define<MapOptions.Props>({
      lat:  [ p.Number     ],
      lng:  [ p.Number     ],
      zoom: [ p.Number, 12 ],
    })
  }
}
MapOptions.initClass()

export namespace GMapOptions {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MapOptions.Props & {
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
    this.define<GMapOptions.Props>({
      map_type:      [ p.String,  "roadmap" ],
      scale_control: [ p.Boolean, false     ],
      styles:        [ p.String             ],
      tilt:          [ p.Int,     45        ],
    })
  }
}
GMapOptions.initClass()

export namespace GMapPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Plot.Props & {
    map_options: p.Property<GMapOptions>
    api_key: p.Property<string>
  }
}

export interface GMapPlot extends GMapPlot.Attrs {}

export class GMapPlot extends Plot {
  properties: GMapPlot.Props

  /*override*/ width: number | null
  /*override*/ height: number | null

  constructor(attrs?: Partial<GMapPlot.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = GMapPlotView

    // This seems to be necessary so that everything can initialize.
    // Feels very clumsy, but I'm not sure how the properties system wants
    // to handle something like this situation.
    this.define<GMapPlot.Props>({
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
    this.use_map = true
    if (!this.api_key)
      logger.error("api_key is required. See https://developers.google.com/maps/documentation/javascript/get-api-key for more information on how to obtain your own.")
  }
}
GMapPlot.initClass()
