import {ColumnarDataSource} from "./columnar_data_source"
import {logger} from "core/logging"
import * as p from "core/properties"

export class GeoJSONDataSource extends ColumnarDataSource
  type: 'GeoJSONDataSource'

  @define {
    geojson: [ p.Any     ] # TODO (bev)
  }

  @internal {
    data:    [ p.Any,   {} ]
  }

  initialize: (options) ->
    super(options)
    @_update_data()
    @listenTo(@, 'change:geojson', () => @_update_data())

  _update_data: () -> @data = @geojson_to_column_data()

  _get_new_list_array: (length) -> ([] for i in [0...length])

  _get_new_nan_array: (length) -> (NaN for i in [0...length])

  _flatten_function: (accumulator, currentItem) ->
    return accumulator.concat([[NaN, NaN, NaN]]).concat(currentItem)

  _add_properties: (item, data, i, item_count) ->
    for property of item.properties
      if !data.hasOwnProperty(property)
        data[property] = @_get_new_nan_array(item_count)
      data[property][i] = item.properties[property]

  _add_geometry: (geometry, data, i) ->

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
        flattened_coord_list = geometry.coordinates.reduce(@_flatten_function)
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

        flattened_coord_list = exterior_rings.reduce(@_flatten_function)
        for coords, j in flattened_coord_list
          data.xs[i][j] = coords[0]
          data.ys[i][j] = coords[1]
          data.zs[i][j] = coords[2] ? NaN

      else
        throw new Error('Invalid type ' + geometry.type)

  _get_items_length: (items) ->
    count = 0
    for item, i in items
      geometry = if item.type == 'Feature' then item.geometry else item
      if geometry.type == 'GeometryCollection'
        for g, j in geometry.geometries
          count += 1
      else
        count += 1
    return count

  geojson_to_column_data: () ->
    geojson = JSON.parse(@geojson)

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

    item_count = @_get_items_length(items)

    data = {
      'x': @_get_new_nan_array(item_count),
      'y': @_get_new_nan_array(item_count),
      'z': @_get_new_nan_array(item_count),
      'xs': @_get_new_list_array(item_count),
      'ys': @_get_new_list_array(item_count),
      'zs': @_get_new_list_array(item_count)
    }

    arr_index = 0
    for item, i in items
      geometry = if item.type == 'Feature' then item.geometry else item

      if geometry.type == 'GeometryCollection'
        for g, j in geometry.geometries
          @_add_geometry(g, data, arr_index)
          if item.type == 'Feature'
            @_add_properties(item, data, arr_index, item_count)
          arr_index += 1
      else
        # Now populate based on Geometry type
        @_add_geometry(geometry, data, arr_index)
        if item.type == 'Feature'
          @_add_properties(item, data, arr_index, item_count)

        arr_index += 1

    return data
