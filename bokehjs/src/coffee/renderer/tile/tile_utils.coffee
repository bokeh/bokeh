
class ProjectionUtils

  constructor: () ->
    @origin_shift = 2 * Math.PI * 6378137 / 2.0

  geographic_to_meters: (xLon, yLat) ->
    mx = xLon * @origin_shift / 180.0
    my = Math.log( Math.tan((90 + yLat) * Math.PI / 360.0 )) / (Math.PI / 180.0)
    my = my * @origin_shift / 180.0
    return [mx, my]

  meters_to_geographic: (mx, my) ->
    lon = (mx / @origin_shift) * 180.0
    lat = (my / @origin_shift) * 180.0
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0)
    return [lon, lat]

  geographic_extent_to_meters: (extent) ->
    [xmin, ymin, xmax, ymax] = extent
    [xmin, ymin] = @geographic_to_meters(xmin, ymin)
    [xmax, ymax] = @geographic_to_meters(xmax, ymax)
    return [xmin, ymin, xmax, ymax]

  meters_extent_to_geographic: (extent) ->
    [xmin, ymin, xmax, ymax] = extent
    [xmin, ymin] = @meters_to_geographic(xmin, ymin)
    [xmax, ymax] = @meters_to_geographic(xmax, ymax)
    return [xmin, ymin, xmax, ymax]


module.exports =
  ProjectionUtils : ProjectionUtils
