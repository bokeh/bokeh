import {Plot} from "./plot"
import * as p from "core/properties"
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
  override properties: MapOptions.Props

  constructor(attrs?: Partial<MapOptions.Attrs>) {
    super(attrs)
  }

  static {
    this.define<MapOptions.Props>(({Int, Number}) => ({
      lat:  [ Number ],
      lng:  [ Number ],
      zoom: [ Int, 12 ],
    }))
  }
}

export namespace GMapOptions {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MapOptions.Props & {
    map_type: p.Property<string>
    scale_control: p.Property<boolean>
    styles: p.Property<string>
    tilt: p.Property<number>
  }
}

export interface GMapOptions extends GMapOptions.Attrs {}

export class GMapOptions extends MapOptions {
  override properties: GMapOptions.Props

  constructor(attrs?: Partial<GMapOptions.Attrs>) {
    super(attrs)
  }

  static {
    this.define<GMapOptions.Props>(({Boolean, Int, String}) => ({
      map_type:      [ MapType, "roadmap" ],
      scale_control: [ Boolean, false     ],
      styles:        [ String             ], // XXX: non-nullable, JSON
      tilt:          [ Int,     45        ],
    }))
  }
}

export namespace GMapPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Plot.Props & {
    map_options: p.Property<GMapOptions>
    api_key: p.Property<string>
    api_version: p.Property<string>
  }
}

export interface GMapPlot extends GMapPlot.Attrs {}

export class GMapPlot extends Plot {
  override properties: GMapPlot.Props

  override use_map = true

  constructor(attrs?: Partial<GMapPlot.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GMapPlotView

    // This seems to be necessary so that everything can initialize.
    // Feels very clumsy, but I'm not sure how the properties system wants
    // to handle something like this situation.
    this.define<GMapPlot.Props>(({String, Ref}) => ({
      map_options: [ Ref(GMapOptions) ],
      api_key:     [ String ],
      api_version: [ String, "3.43" ],
    }))

    this.override<GMapPlot.Props>({
      x_range: () => new Range1d(),
      y_range: () => new Range1d(),
    })
  }
}
