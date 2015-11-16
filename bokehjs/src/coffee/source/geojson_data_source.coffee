_ = require "underscore"
ColumnDataSource = require "./column_data_source"

class GeoJSONDataSource extends ColumnDataSource.Model
  type: 'ColumnDataSource'

  initialize: (options) ->
    @set('geojson', JSON.parse(options.geojson))
    @set('data', @geojson_to_column_data())
    super(options)

  _get_new_nan_array: (length) ->
    array = new Array(length)
    nan_array = _.map(array, (x) -> NaN)
    return nan_array

  geojson_to_column_data: () ->
    geojson = @get('geojson')
    if geojson['type'] != "FeatureCollection" and "features" not in geojson
        throw new Error("Only FeatureCollections are currently supported")
    features = geojson['features']
    data_length = features.length
    data = {}
    for feature, i in features
      if feature['type'] != "Feature"
        throw new Error("Feature not found in geojson features array")
      properties = feature.properties ? {}
      geometry = feature.geometry
      geometry_type = geometry.type
      geometry_coords = geometry.coordinates

    if geometry_type == "Point"
        if !data.hasOwnProperty('x')
          data['x'] = @_get_new_nan_array(data_length)
        if !data.hasOwnProperty('y')
          data['y'] = @_get_new_nan_array(data_length)
        if !data.hasOwnProperty('z')
          data['z'] = @_get_new_nan_array(data_length)
      else
        if !data.hasOwnProperty('xs')
          data['xs'] = @_get_new_list_array(data_length)
        if !data.hasOwnProperty('ys')
          data['ys'] = @_get_new_list_array(data_length)
        if !data.hasOwnProperty('zs')
          data['zs'] = @_get_new_list_array(data_length)

      if geometry_type == "Point"
        data['x'][i] = geometry_coords[0]
        data['y'][i] = geometry_coords[1]
        data['z'][i] = geometry_coords[2] ? NaN

      if geometry_type == "LineString"
        for point, j in geometry_coords
          data['xs'][i][j] = point[0]
          data['ys'][i][j] = point[1]
          data['zs'][i][j] = point[2] ? NaN

      if geometry_type == "Polygon"
        if geometry_coords.length > 1
            logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.')
        exterior_ring = geometry_coords[0]
        for point, j in exterior_ring
          data['xs'][i][j] = point[0]
          data['ys'][i][j] = point[1]
          data['zs'][i][j] = point[2] ? NaN

      if geometry_type == "MultiPoint"
        logger.warn('MultiPoint not supported in Bokeh')

      if geometry_type == "MultiLineString"
        for linestring in geometry_coords
          for point, j in linestring
            data['xs'][i][j] = point[0]
            data['ys'][i][j] = point[1]
            data['zs'][i][j] = point[2] ? NaN
          data['xs'][i][j] = NaN
          data['ys'][i][j] = NaN
          data['zs'][i][j] = NaN
        
      if geometry_type == "MultiPolygon"
        for polygon in geometry_coords
          if polygon.length > 1
            logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.')
          exterior_ring = polygon[0]
          for point, j in exterior_ring
            data['xs'][i][j] = point[0]
            data['ys'][i][j] = point[1]
            data['zs'][i][j] = point[2] ? NaN
          data['xs'][i][j] = NaN
          data['ys'][i][j] = NaN
          data['zs'][i][j] = NaN

      for property of properties
        if !data.hasOwnProperty(property)
          data[property] = @_get_new_nan_array(data_length)
        data[property][i] = properties[property]

    return data

module.exports =
  Model: GeoJSONDataSource
