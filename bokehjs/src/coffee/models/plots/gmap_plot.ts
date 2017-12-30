import {logger} from "core/logging"

import {GMapPlotCanvas} from "./gmap_plot_canvas"
import {PlotCanvas} from "./plot_canvas"
import {Plot, PlotView} from "./plot"
import * as p from "core/properties"
import {Model} from "../../model"

export class MapOptions extends Model {
  lat: number
  lng: number
  zoom: number
}

MapOptions.prototype.type = "MapOptions"

MapOptions.define({
  lat:  [ p.Number     ],
  lng:  [ p.Number     ],
  zoom: [ p.Number, 12 ],
})

export class GMapOptions extends MapOptions {
  map_type: string
  scale_control: boolean
  styles: string
}

GMapOptions.prototype.type = "GMapOptions"

GMapOptions.define({
  map_type:      [ p.String, "roadmap" ],
  scale_control: [ p.Bool,   false     ],
  styles:        [ p.String            ],
})

export class GMapPlotView extends PlotView {}

export class GMapPlot extends Plot {

  map_options: GMapOptions
  api_key: string

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)
    if (!this.api_key)
      logger.error("api_key is required. See https://developers.google.com/maps/documentation/javascript/get-api-key for more information on how to obtain your own.")
  }

  protected _init_plot_canvas(): PlotCanvas {
    return new GMapPlotCanvas({plot: this})
  }
}

GMapPlot.prototype.type = "GMapPlot"

GMapPlot.prototype.default_view = GMapPlotView

// Set all the PlotCanvas properties as internal.
// This seems to be necessary so that everything can initialize.
// Feels very clumsy, but I'm not sure how the properties system wants
// to handle something like this situation.
GMapPlot.define({
  map_options: [ p.Instance ],
  api_key:     [ p.String   ],
})
