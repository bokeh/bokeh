import {logger} from "core/logging"

import {GMapPlotCanvas} from "./gmap_plot_canvas"
import {Plot, PlotView} from "./plot"
import * as p from "core/properties"
import {Model} from "../../model"

export class MapOptions extends Model
  type: 'MapOptions'
  @define {
    lat:  [ p.Number     ]
    lng:  [ p.Number     ]
    zoom: [ p.Number, 12 ]
  }

export class GMapOptions extends MapOptions
  type: 'GMapOptions'
  @define {
    map_type:      [ p.String, "roadmap" ]
    scale_control: [ p.Bool,   false     ]
    styles:        [ p.String            ]
  }

export class GMapPlotView extends PlotView

export class GMapPlot extends Plot
  type: 'GMapPlot'
  default_view: GMapPlotView

  initialize: (options) ->
    super(options)
    if not @api_key
      logger.error("api_key is required. See https://developers.google.com/maps/documentation/javascript/get-api-key for more information on how to obtain your own.")

  _init_plot_canvas: () ->
    return new GMapPlotCanvas({plot: @})

  # Set all the PlotCanvas properties as internal.
  # This seems to be necessary so that everything can initialize.
  # Feels very clumsy, but I'm not sure how the properties system wants
  # to handle something like this situation.
  @define {
    map_options: [ p.Instance ]
    api_key:     [ p.String   ]
  }
