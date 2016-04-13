_ = require "underscore"

ColumnDataSource = require "./column_data_source"
{logger} = require "../../core/logging"
p = require "../../core/properties"

class GeoJSONDataSource extends ColumnDataSource.Model
  type: 'GeoJSONDataSource'

  @define {
      geojson: [ p.Any     ] # TODO (bev)
    }

  # TODO (bev) investigate, exists on python side
  # nonserializable_attribute_names: () ->
  #   super().concat(['data'])

  initialize: (options) ->
    super(options)
    @geojson_to_column_data() # this just validates the initial geojson value
    @define_computed_property('data', @geojson_to_column_data, true)
    @add_dependencies('data', this, ['geojson'])

  _get_new_list_array: (length) ->
    array = new Array(length)
    list_array = _.map(array, (x) -> [])
    return list_array

  _get_new_nan_array: (length) ->
    array = new Array(length)
    nan_array = _.map(array, (x) -> NaN)
    return nan_array

  geojson_to_column_data: () ->
    geojson = JSON.parse(@get('geojson'))

    if geojson.type not in ['GeometryCollection', 'FeatureCollection']
      throw new Error('Bokeh only supports type GeometryCollection and FeatureCollection at top level')

    if geojson.type == 'GeometryCollection'
      if not geojson.geometries?
        throw new Error('No geometries found in GeometryCollection')
      if geojson.geometries.length == 0
        throw new Error('geojson.geometries must have one or more items')
      items = geojson.geometries

    if geojson.type == 'FeatureCollection'
      if not geojson.features?
        throw new Error('No features found in FeaturesCollection')
      if geojson.features.length == 0
        throw new Error('geojson.features must have one or more items')
      items = geojson.features

    data = {
      'x': @_get_new_nan_array(items.length),
      'y': @_get_new_nan_array(items.length),
      'z': @_get_new_nan_array(items.length),
      'xs': @_get_new_list_array(items.length),
      'ys': @_get_new_list_array(items.length),
      'zs': @_get_new_list_array(items.length)
    }

    # The flatten function is used to link together MultiLines and MultPolygons with NaNs
    flatten_function = (accumulator, currentItem) ->
      return accumulator.concat([[NaN, NaN, NaN]]).concat(currentItem)

    for item, i in items


      if item.type == 'Feature'
        geometry = item.geometry

        # Only Features have properties
        for property of item.properties
          if !data.hasOwnProperty(property)
            data[property] = @_get_new_nan_array(items.length)
          data[property][i] = item.properties[property]

      else
        geometry = item

      # Now populate based on Geometry type

      switch geometry.type

        when "Point"
          coords = geometry.coordinates
          data.x[i] = coords[0]
          data.y[i] = coords[1]
          data.z[i] = coords[2] ? NaN

        when "LineString"
          coord_list = geometry.coordinates
          for coords, j in coord_list
            data.xs[i][j] = coords[0]
            data.ys[i][j] = coords[1]
            data.zs[i][j] = coords[2] ? NaN

        when "Polygon"
          if geometry.coordinates.length > 1
            logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.')
          exterior_ring = geometry.coordinates[0]
          for coords, j in exterior_ring
            data.xs[i][j] = coords[0]
            data.ys[i][j] = coords[1]
            data.zs[i][j] = coords[2] ? NaN

        when "MultiPoint"
          logger.warn('MultiPoint not supported in Bokeh')

        when "MultiLineString"
          flattened_coord_list = _.reduce(geometry.coordinates, flatten_function)
          for coords, j in flattened_coord_list
            data.xs[i][j] = coords[0]
            data.ys[i][j] = coords[1]
            data.zs[i][j] = coords[2] ? NaN

        when "MultiPolygon"
          exterior_rings = []
          for polygon in geometry.coordinates
            if polygon.length > 1
              logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.')
            exterior_rings.push(polygon[0])
          flattened_coord_list = _.reduce(exterior_rings, flatten_function)
          for coords, j in flattened_coord_list
            data.xs[i][j] = coords[0]
            data.ys[i][j] = coords[1]
            data.zs[i][j] = coords[2] ? NaN

        else
          throw new Error('Invalid type ' + geometry.type)

    return data

module.exports =
  Model: GeoJSONDataSource
