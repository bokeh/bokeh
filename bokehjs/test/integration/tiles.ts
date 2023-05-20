import {display, fig, row} from "./_util"

import {Range1d} from "@bokehjs/models/ranges"
import type {Plot} from "@bokehjs/models/plots"
import type {TileSource} from "@bokehjs/models/tiles"
import {TileRenderer, WMTSTileSource} from "@bokehjs/models/tiles"

describe("TileRenderer", () => {

  it.skip("should support smoothed and non-smoothed images", async () => {
    // range bounds supplied in web mercator coordinates
    const x_range = new Range1d({start: -2000000, end: 6000000})
    const y_range = new Range1d({start: -1000000, end: 7000000})
    const x_axis_type = "mercator"
    const y_axis_type = "mercator"
    const p0 = fig([300, 300], {x_range, y_range, x_axis_type, y_axis_type, title: "Smoothed"})
    const p1 = fig([300, 300], {x_range, y_range, x_axis_type, y_axis_type, title: "Non-smoothed"})

    // CARTODBPOSITRON, CARTO_ATTRIBUTION
    const url = "https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
    const attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,' +
        '&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
    const tile_provider = new WMTSTileSource({url, attribution})

    function add_tile(plot: Plot, tile_source: TileSource, attrs: Partial<TileRenderer.Attrs> = {}): TileRenderer {
      const renderer = new TileRenderer({tile_source, ...attrs})
      plot.renderers = plot.renderers.concat(renderer)
      return renderer
    }

    add_tile(p0, tile_provider, {smoothing: true})
    add_tile(p1, tile_provider, {smoothing: false})

    await display(row([p0, p1]))
  })
})
