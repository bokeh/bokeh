import type {Feature, FeatureCollection, Geometry, GeometryCollection} from "geojson"

import type * as p from "core/properties"
import {GeometryDataSource, geojson_to_geometry_records} from "./geometry_data_source"

export namespace GeoJSONDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GeometryDataSource.Props & {
    geojson: p.Property<string>
  }
}

export interface GeoJSONDataSource extends GeoJSONDataSource.Attrs {}

/** A GeometryDataSource populated from a GeoJSON document. */
export class GeoJSONDataSource extends GeometryDataSource {
  declare properties: GeoJSONDataSource.Props

  static {
    this.define<GeoJSONDataSource.Props>(({Str}) => ({
      geojson: [ Str ],
    }))
  }

  override initialize(): void {
    super.initialize()
    this._update_data()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.geojson.change, () => this._update_data())
  }

  protected _update_data(): void {
    const geojson = JSON.parse(this.geojson) as FeatureCollection | GeometryCollection | Feature | Geometry
    const {geometries, data} = geojson_to_geometry_records(geojson)
    // geojson is the synchronized source of truth. Python server models derive
    // these same records, so avoid echoing browser-side materialization.
    this.setv({geometries, data}, {sync: false})
  }
}
