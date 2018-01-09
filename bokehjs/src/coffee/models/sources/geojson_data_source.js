/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {ColumnarDataSource} from "./columnar_data_source";
import {logger} from "core/logging";
import * as p from "core/properties"
;

export class GeoJSONDataSource extends ColumnarDataSource {
  static initClass() {
    this.prototype.type = 'GeoJSONDataSource';

    this.define({
      geojson: [ p.Any     ] // TODO (bev)
    });

    this.internal({
      data:    [ p.Any,   {} ]
    });
  }

  initialize(options) {
    super.initialize(options);
    this._update_data();
    return this.connect(this.properties.geojson.change, () => this._update_data());
  }

  _update_data() { return this.data = this.geojson_to_column_data(); }

  _get_new_list_array(length) { return (__range__(0, length, false).map((i) => [])); }

  _get_new_nan_array(length) { return (__range__(0, length, false).map((i) => NaN)); }

  _flatten_function(accumulator, currentItem) {
    return accumulator.concat([[NaN, NaN, NaN]]).concat(currentItem);
  }

  _add_properties(item, data, i, item_count) {
    return (() => {
      const result = [];
      for (let property in item.properties) {
        if (!data.hasOwnProperty(property)) {
          data[property] = this._get_new_nan_array(item_count);
        }
        result.push(data[property][i] = item.properties[property]);
      }
      return result;
    })();
  }

  _add_geometry(geometry, data, i) {

    switch (geometry.type) {

      case "Point":
        var coords = geometry.coordinates;
        data.x[i] = coords[0];
        data.y[i] = coords[1];
        return data.z[i] = coords[2] != null ? coords[2] : NaN;

      case "LineString":
        var coord_list = geometry.coordinates;
        return (() => {
          const result = [];
          for (let j = 0; j < coord_list.length; j++) {
            coords = coord_list[j];
            data.xs[i][j] = coords[0];
            data.ys[i][j] = coords[1];
            result.push(data.zs[i][j] = coords[2] != null ? coords[2] : NaN);
          }
          return result;
        })();

      case "Polygon":
        if (geometry.coordinates.length > 1) {
          logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.');
        }
        var exterior_ring = geometry.coordinates[0];
        return (() => {
          const result1 = [];
          for (let j = 0; j < exterior_ring.length; j++) {
            coords = exterior_ring[j];
            data.xs[i][j] = coords[0];
            data.ys[i][j] = coords[1];
            result1.push(data.zs[i][j] = coords[2] != null ? coords[2] : NaN);
          }
          return result1;
        })();

      case "MultiPoint":
        return logger.warn('MultiPoint not supported in Bokeh');

      case "MultiLineString":
        var flattened_coord_list = geometry.coordinates.reduce(this._flatten_function);
        return (() => {
          const result2 = [];
          for (let j = 0; j < flattened_coord_list.length; j++) {
            coords = flattened_coord_list[j];
            data.xs[i][j] = coords[0];
            data.ys[i][j] = coords[1];
            result2.push(data.zs[i][j] = coords[2] != null ? coords[2] : NaN);
          }
          return result2;
        })();

      case "MultiPolygon":
        var exterior_rings = [];
        for (let polygon of Array.from(geometry.coordinates)) {
          if (polygon.length > 1) {
            logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.');
          }
          exterior_rings.push(polygon[0]);
        }

        flattened_coord_list = exterior_rings.reduce(this._flatten_function);
        return (() => {
          const result3 = [];
          for (let j = 0; j < flattened_coord_list.length; j++) {
            coords = flattened_coord_list[j];
            data.xs[i][j] = coords[0];
            data.ys[i][j] = coords[1];
            result3.push(data.zs[i][j] = coords[2] != null ? coords[2] : NaN);
          }
          return result3;
        })();

      default:
        throw new Error(`Invalid type ${geometry.type}`);
    }
  }

  _get_items_length(items) {
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const geometry = item.type === 'Feature' ? item.geometry : item;
      if (geometry.type === 'GeometryCollection') {
        for (let j = 0; j < geometry.geometries.length; j++) {
          const g = geometry.geometries[j];
          count += 1;
        }
      } else {
        count += 1;
      }
    }
    return count;
  }

  geojson_to_column_data() {
    let items;
    const geojson = JSON.parse(this.geojson);

    if (!(geojson.type === 'GeometryCollection' || geojson.type === 'FeatureCollection')) {
      throw new Error('Bokeh only supports type GeometryCollection and FeatureCollection at top level');
    }

    if (geojson.type === 'GeometryCollection') {
      if ((geojson.geometries == null)) {
        throw new Error('No geometries found in GeometryCollection');
      }
      if (geojson.geometries.length === 0) {
        throw new Error('geojson.geometries must have one or more items');
      }
      items = geojson.geometries;
    }

    if (geojson.type === 'FeatureCollection') {
      if ((geojson.features == null)) {
        throw new Error('No features found in FeaturesCollection');
      }
      if (geojson.features.length === 0) {
        throw new Error('geojson.features must have one or more items');
      }
      items = geojson.features;
    }

    const item_count = this._get_items_length(items);

    const data = {
      'x': this._get_new_nan_array(item_count),
      'y': this._get_new_nan_array(item_count),
      'z': this._get_new_nan_array(item_count),
      'xs': this._get_new_list_array(item_count),
      'ys': this._get_new_list_array(item_count),
      'zs': this._get_new_list_array(item_count)
    };

    let arr_index = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const geometry = item.type === 'Feature' ? item.geometry : item;

      if (geometry.type === 'GeometryCollection') {
        for (let j = 0; j < geometry.geometries.length; j++) {
          const g = geometry.geometries[j];
          this._add_geometry(g, data, arr_index);
          if (item.type === 'Feature') {
            this._add_properties(item, data, arr_index, item_count);
          }
          arr_index += 1;
        }
      } else {
        // Now populate based on Geometry type
        this._add_geometry(geometry, data, arr_index);
        if (item.type === 'Feature') {
          this._add_properties(item, data, arr_index, item_count);
        }

        arr_index += 1;
      }
    }

    return data;
  }
}
GeoJSONDataSource.initClass();

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
