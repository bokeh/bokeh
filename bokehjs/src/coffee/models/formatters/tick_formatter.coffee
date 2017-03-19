import {Model} from "../../model"

export class TickFormatter extends Model
  type: 'TickFormatter'

  # Some formatters may require the location on the "cross" range,
  # e.g. WebMercator or any non-separable coordinate system. The
  # "loc" parameter provides this location
  doFormat: (ticks, loc) ->
