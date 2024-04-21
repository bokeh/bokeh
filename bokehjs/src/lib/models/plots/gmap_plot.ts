import {Plot} from "./plot"
import type * as p from "core/properties"
import {MapType} from "core/enums"
import {Model} from "../../model"
import {Range1d} from "../ranges/range1d"

import {GMapPlotView} from "./gmap_plot_canvas"
export {GMapPlotView}

export namespace MapOptions {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    lat: p.Property<number>
    lng: p.Property<number>
    zoom: p.Property<number>
  }
}

export interface MapOptions extends MapOptions.Attrs {}

export class MapOptions extends Model {
  declare properties: MapOptions.Props

  constructor(attrs?: Partial<MapOptions.Attrs>) {
    super(attrs)
  }

  static {
    this.define<MapOptions.Props>(({Int, Float}) => ({
      lat:  [ Float ],
      lng:  [ Float ],
      zoom: [ Int, 12 ],
    }))
  }
}

export namespace GMapOptions {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MapOptions.Props & {
    map_type: p.Property<MapType>
    scale_control: p.Property<boolean>
    styles: p.Property<string | null>
    tilt: p.Property<number>
  }
}

export interface GMapOptions extends GMapOptions.Attrs {}

export class GMapOptions extends MapOptions {
  declare properties: GMapOptions.Props

  constructor(attrs?: Partial<GMapOptions.Attrs>) {
    super(attrs)
  }

  static {
    this.define<GMapOptions.Props>(({Bool, Int, Str, Nullable}) => ({
      map_type:      [ MapType, "roadmap"],
      scale_control: [ Bool, false ],
      styles:        [ Nullable(Str), null ],
      tilt:          [ Int, 45 ],
    }))
  }
}

export namespace GMapPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Plot.Props & {
    map_options: p.Property<GMapOptions>
    api_key: p.Property<ArrayBuffer>
    api_version: p.Property<string>
  }
}

export interface GMapPlot extends GMapPlot.Attrs {}

export class GMapPlot extends Plot {
  declare properties: GMapPlot.Props

  override use_map = true

  constructor(attrs?: Partial<GMapPlot.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GMapPlotView

    this.define<GMapPlot.Props>(({Str, Bytes, Ref}) => ({
      map_options: [ Ref(GMapOptions) ],
      api_key:     [ Bytes ],
      api_version: [ Str, "weekly" ],
    }))

    this.override<GMapPlot.Props>({
      x_range: () => new Range1d(),
      y_range: () => new Range1d(),
      background_fill_alpha: 0.0,
    })
  }
}
