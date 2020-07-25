import {
  FeatureCollection, GeometryCollection, Feature, Position,
  Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon,
} from "geojson"

import {ColumnarDataSource} from "./columnar_data_source"
import {logger} from "core/logging"
import * as p from "core/properties"
import {Arrayable} from "core/types"
import {range} from "core/util/array"
import {entries} from "core/util/object"

type GeoItem = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | GeometryCollection

export type GeoData = {
  x: Arrayable<number>
  y: Arrayable<number>
  z: Arrayable<number>
  xs: Arrayable<Arrayable<number>>
  ys: Arrayable<Arrayable<number>>
  zs: Arrayable<Arrayable<number>>
  [key: string]: Arrayable
}

export namespace GeoJSONDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColumnarDataSource.Props & {
    geojson: p.Property<string>
  }
}

export interface GeoJSONDataSource extends GeoJSONDataSource.Attrs {}

function orNaN(v: number | undefined): number {
  return v != null ? v : NaN
}

export class GeoJSONDataSource extends ColumnarDataSource {
  properties: GeoJSONDataSource.Props

  constructor(attrs?: Partial<GeoJSONDataSource.Attrs>) {
    super(attrs)
  }

  static init_GeoJSONDataSource(): void {
    this.define<GeoJSONDataSource.Props>({
      geojson: [ p.Any ], // TODO (bev)
    })

    this.internal({
      data:    [ p.Any, {} ],
    })
  }

  initialize(): void {
    super.initialize()
    this._update_data()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.geojson.change, () => this._update_data())
  }

  protected _update_data(): void {
    this.data = this.geojson_to_column_data()
  }

  protected _get_new_list_array(length: number): number[][] {
    return range(0, length).map((_i) => [])
  }

  protected _get_new_nan_array(length: number): number[] {
    return range(0, length).map((_i) => NaN)
  }

  private _add_properties(item: Feature<GeoItem>, data: GeoData, i: number, item_count: number): void {
    const properties = item.properties ?? {}
    for (const [property, value] of entries(properties)) {
      if (!data.hasOwnProperty(property))
        data[property] = this._get_new_nan_array(item_count)
      // orNaN necessary here to prevent null values from ending up in the column
      data[property][i] = orNaN(value)
    }
  }

  private _add_geometry(geometry: GeoItem, data: GeoData, i: number): void {

    function flatten(acc: Position[], item: Position[]) {
      return acc.concat([[NaN, NaN, NaN]]).concat(item)
    }

    switch (geometry.type) {
      case "Point": {
        const [x, y, z] = geometry.coordinates
        data.x[i] = x
        data.y[i] = y
        data.z[i] = orNaN(z)
        break
      }
      case "LineString": {
        const {coordinates} = geometry
        for (let j = 0; j < coordinates.length; j++) {
          const [x, y, z] = coordinates[j]
          data.xs[i][j] = x
          data.ys[i][j] = y
          data.zs[i][j] = orNaN(z)
        }
        break
      }
      case "Polygon": {
        if (geometry.coordinates.length > 1)
          logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.')

        const exterior_ring = geometry.coordinates[0]
        for (let j = 0; j < exterior_ring.length; j++) {
          const [x, y, z] = exterior_ring[j]
          data.xs[i][j] = x
          data.ys[i][j] = y
          data.zs[i][j] = orNaN(z)
        }
        break
      }
      case "MultiPoint": {
        logger.warn('MultiPoint not supported in Bokeh')
        break
      }
      case "MultiLineString": {
        const coordinates = geometry.coordinates.reduce(flatten)
        for (let j = 0; j < coordinates.length; j++) {
          const [x, y, z] = coordinates[j]
          data.xs[i][j] = x
          data.ys[i][j] = y
          data.zs[i][j] = orNaN(z)
        }
        break
      }
      case "MultiPolygon": {
        const exterior_rings = []
        for (const polygon of geometry.coordinates) {
          if (polygon.length > 1)
            logger.warn('Bokeh does not support Polygons with holes in, only exterior ring used.')
          exterior_rings.push(polygon[0])
        }

        const coordinates = exterior_rings.reduce(flatten)
        for (let j = 0; j < coordinates.length; j++) {
          const [x, y, z] = coordinates[j]
          data.xs[i][j] = x
          data.ys[i][j] = y
          data.zs[i][j] = orNaN(z)
        }
        break
      }
      default:
        throw new Error(`Invalid GeoJSON geometry type: ${geometry.type}`)
    }
  }

  geojson_to_column_data(): GeoData {
    const geojson = JSON.parse(this.geojson) as FeatureCollection<GeoItem> | GeometryCollection

    let items: (Feature<GeoItem> | GeoItem)[]
    switch (geojson.type) {
      case "GeometryCollection": {
        if (geojson.geometries == null)
          throw new Error('No geometries found in GeometryCollection')

        if (geojson.geometries.length === 0)
          throw new Error('geojson.geometries must have one or more items')

        items = geojson.geometries
        break
      }
      case "FeatureCollection": {
        if (geojson.features == null)
          throw new Error('No features found in FeaturesCollection')

        if (geojson.features.length == 0)
          throw new Error('geojson.features must have one or more items')

        items = geojson.features
        break
      }
      default:
        throw new Error('Bokeh only supports type GeometryCollection and FeatureCollection at top level')
    }

    let item_count = 0
    for (const item of items) {
      const geometry = item.type === 'Feature' ? item.geometry! : item
      if (geometry.type == 'GeometryCollection')
        item_count += geometry.geometries.length
      else
        item_count += 1
    }

    const data: GeoData = {
      x: this._get_new_nan_array(item_count),
      y: this._get_new_nan_array(item_count),
      z: this._get_new_nan_array(item_count),
      xs: this._get_new_list_array(item_count),
      ys: this._get_new_list_array(item_count),
      zs: this._get_new_list_array(item_count),
    }

    let arr_index = 0
    for (const item of items) {
      const geometry = item.type == 'Feature' ? item.geometry! : item

      if (geometry.type == "GeometryCollection") {
        for (const g of geometry.geometries) {
          this._add_geometry(g, data, arr_index)
          if (item.type === 'Feature')
            this._add_properties(item, data, arr_index, item_count)
          arr_index += 1
        }
      } else {
        this._add_geometry(geometry, data, arr_index)
        if (item.type === 'Feature')
          this._add_properties(item, data, arr_index, item_count)
        arr_index += 1
      }
    }

    return data
  }
}
