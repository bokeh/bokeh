import {BasicTickFormatter} from "./basic_tick_formatter"
import * as p from "core/properties"
import {proj4, mercator} from "core/util/proj4"

export class MercatorTickFormatter extends BasicTickFormatter
  type: 'MercatorTickFormatter'

  @define {
    dimension: [ p.LatLon ]
  }

  doFormat: (ticks, axis) ->
    if not @dimension?
      throw new Error("MercatorTickFormatter.dimension not configured")

    if ticks.length == 0
      return []

    proj_ticks = new Array(ticks.length)

    if @dimension == "lon"
      for i in [0...ticks.length]
        [lon, lat] = proj4(mercator).inverse([ticks[i], axis.loc])
        proj_ticks[i] = lon
    else
      for i in [0...ticks.length]
        [lon, lat] = proj4(mercator).inverse([axis.loc, ticks[i]])
        proj_ticks[i] = lat

    return super(proj_ticks, axis)
