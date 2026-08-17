import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {shuffle} from "@bokehjs/core/util/array"
import {delay} from "@bokehjs/core/util/defer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {Range} from "@bokehjs/models/ranges/range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {DataRange1d} from "@bokehjs/models/ranges/data_range1d"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {TileRenderer} from "@bokehjs/models/tiles/tile_renderer"
import {TileSource} from "@bokehjs/models/tiles/tile_source"
import {MercatorTileSource} from "@bokehjs/models/tiles/mercator_tile_source"
import {TMSTileSource} from "@bokehjs/models/tiles/tms_tile_source"
import {WMTSTileSource} from "@bokehjs/models/tiles/wmts_tile_source"
import {QUADKEYTileSource} from "@bokehjs/models/tiles/quadkey_tile_source"
import {BBoxTileSource} from "@bokehjs/models/tiles/bbox_tile_source"
import * as tile_utils from "@bokehjs/models/tiles/tile_utils"
import type {Extent} from "@bokehjs/models/tiles/tile_utils"

describe("projection utilities", () => {

  it("should convert lat/lng to meters", () => {
    const [x, y] = tile_utils.geographic_to_meters(-90.17578125, 29.840643899834436)
    expect(x).to.be.similar(-10038322.050635627)
    expect(y).to.be.similar(3483082.504898913)
  })

  it("should convert meters to lat/lng", () => {
    const [x, y] = tile_utils.meters_to_geographic(-10038322.050635627, 3483082.504898913)
    expect(x).to.be.similar(-90.17578125)
    expect(y).to.be.similar(29.840643899834436)
  })

  it("should convert geographic extent to meters", () => {
    const extent: Extent = [-67.5, -21.943045533438166, -45, 0]
    const bounds = tile_utils.geographic_extent_to_meters(extent)
    expect(bounds).to.be.similar([
      -7514065.628545966,
      -2504688.542848654,
      -5009377.085697312,
      0,
    ])
  })

  it("should convert meters extent to geographic", () => {
    const extent: Extent = [-7514065.628545966, -2504688.542848654, -5009377.085697312, 0]
    const bounds = tile_utils.meters_extent_to_geographic(extent)
    expect(bounds).to.be.similar([
      -67.5,
      -21.943045533438166,
      -45,
      0,
    ])
  })
})

class TileExpects {
  readonly MERCATOR_BOUNDS: Extent
  readonly GEOGRAPHIC_BOUNDS: Extent

  constructor() {
    const n = 20037508.34
    this.MERCATOR_BOUNDS = [n * -1, n * -1, n, n]
    this.GEOGRAPHIC_BOUNDS = [-180, -90, 180, 90]
  }

  expect_mercator_tile_counts(source: TileSource): void {
    for (const zoom_level of [1, 2, 3, 4, 5]) {
      const tiles = source.get_tiles_by_extent(this.MERCATOR_BOUNDS, zoom_level, 0)
      expect(tiles.length).to.be.equal(2**zoom_level * 2**zoom_level)
    }
  }

  expect_geographic_tile_counts(source: TileSource): void {
    // assumes 512 tile size
    for (const zoom_level of [0, 1, 2, 3, 4, 5]) {
      const tiles = source.get_tiles_by_extent(this.GEOGRAPHIC_BOUNDS, zoom_level, 0)
      expect(tiles.length).to.be.equal(4**zoom_level*2)
    }
  }
}

describe("tile sources", () => {

  const AbstractTileSource = TileSource as any // XXX: TileSource is abstract
  const T = new TileExpects()

  describe("tile source (base class)", () => {
    const tile_options = {
      url: "http://c.tiles.mapbox.com/v3/examples.map-szwdot65/{Z}/{X}/{Y}.png",
    }

    const source = new AbstractTileSource(tile_options)

    it("should convert tile xyz into a tile key", () => {
      const k = source.tile_xyz_to_key(1, 1, 1)
      expect(k).to.be.equal("1:1:1")
    })

    it("should convert tile key to tile xyz", () => {
      const xyz = source.key_to_tile_xyz("1:1:1")
      expect(xyz).to.be.equal([1, 1, 1])
    })

    it("should successfully set x_origin_offset and y_origin_offset", () => {
      const tile_options = {
        x_origin_offset: 0,
        y_origin_offset: 0,
      }
      const offset_source = new AbstractTileSource(tile_options)
      expect(offset_source.x_origin_offset).to.be.equal(0)
      expect(offset_source.y_origin_offset).to.be.equal(0)
    })

    it("should successfully set extra_url_vars property", () => {
      const test_extra_url_vars = {
        test_key: "test_value",
        test_key2: "test_value2",
      }

      const tile_options = {
        url: "http://{test_key}/{test_key2}/{X}/{Y}/{Z}.png",
        extra_url_vars: test_extra_url_vars,
      }

      const tile_source = new AbstractTileSource(tile_options)
      const expect_url = "http://test_value/test_value2/0/0/0.png"
      expect(tile_source.extra_url_vars).to.be.equal(test_extra_url_vars)
      expect(tile_source.get_image_url(0, 0, 0)).to.be.equal(expect_url)
    })

    it("should handle case-insensitive url parameters (template url)", () => {
      const expect_url = "http://mock/0/0/0.png"

      const tile_options0 = {
        url: "http://mock/{x}/{y}/{z}.png",
      }
      const tile_source0 = new AbstractTileSource(tile_options0)
      expect(tile_source0.get_image_url(0, 0, 0)).to.be.equal(expect_url)

      const tile_options1 = {
        url: "http://mock/{X}/{Y}/{Z}.png",
      }
      const tile_source1 = new AbstractTileSource(tile_options1)
      expect(tile_source1.get_image_url(0, 0, 0)).to.be.equal(expect_url)
    })

    it("should return tiles in ascending distance from center tile", () => {
      let tiles = []
      for (const x of [1, 2, 3, 4, 5, 6]) {
        for (const y of [1, 2, 3, 4, 5, 6]) {
          tiles.push([x, y])
        }
      }

      tiles = shuffle(tiles)
      source.sort_tiles_from_center(tiles, [1, 1, 6, 6])

      for (const i of [0, 1, 2, 3]) {
        const [a, b] = tiles[i]
        expect(a == 3 || a == 4).to.be.true
        expect(b == 3 || b == 4).to.be.true
      }
    })

    it("should invalidate cache on property change", () => {
      const tile_options = {
        url: "http://mock/{x}/{y}/{z}.png",
      }
      const tile_source = new AbstractTileSource(tile_options)
      const tile = {tile_coords: [0, 1, 2]}
      tile_source.tiles.mock_key = tile
      tile_source.url = "http://mock/{x}/{y}/{z}.png"
      expect(tile_source.tiles).to.be.empty
    })
  })

  describe("tms tile source", () => {
    const url = "http://c.tiles.mapbox.com/v3/examples.map-szwdot65/{Z}/{X}/{Y}.png"
    const source = new TMSTileSource({url})

    it("should get tiles for extent correctly", () => {
      T.expect_mercator_tile_counts(source)
    })

    it("should successfully set x_origin_offset and y_origin_offset", () => {
      const tile_options = {
        x_origin_offset: 0,
        y_origin_offset: 0,
      }
      const offset_source = new TMSTileSource(tile_options)
      expect(offset_source.x_origin_offset).to.be.equal(0)
      expect(offset_source.y_origin_offset).to.be.equal(0)
    })

    it("should account of x_origin_offset and y_origin_offset", () => {
      const tile_options = {
        x_origin_offset: 0,
        y_origin_offset: 0,
      }
      const offset_source = new TMSTileSource(tile_options)
      const bounds = offset_source.get_tile_meter_bounds(0, 0, 16)
      expect(bounds.includes(0)).to.be.true
    })

    it("should calculate resolution", () => {
      expect(source.get_resolution(1)).to.be.similar(78271.517)
      expect(source.get_resolution(12)).to.be.similar(38.2185)
    })
  })

  describe("wmts tile source", () => {
    const tile_options = {
      url: "http://mt0.google.com/vt/lyrs=m@169000000&hl=en&x={X}&y={Y}&z={Z}&s=Ga",
    }

    const source = new WMTSTileSource(tile_options)

    it("should get tiles for extent correctly", () => {
      T.expect_mercator_tile_counts(source)
    })

    it("should get tile bounds in meters", () => {
      const [x, y, z] = source.wmts_to_tms(511, 845, 11)
      const bounds = source.get_tile_meter_bounds(x, y, z)
      expect(bounds).to.be.similar([
        -10038322.050635627,
        3483082.504898913,
        -10018754.171394622,
        3502650.384139918,
      ], 0.01)
    })

    it("should get tile bounds in lat/lng", () => {
      const [x, y, z] = source.wmts_to_tms(511, 845, 11)
      const bounds = source.get_tile_geographic_bounds(x, y, z)
      expect(bounds).to.be.similar([
        -90.17578125,
        29.840643899834436,
        -90,
        29.99300228455108,
      ], 0.01)
    })
  })

  describe("quadkey tile source", () => {
    const tile_options = {
      url: "http://t0.tiles.virtualearth.net/tiles/a{Q}.jpeg?g=854&mkt=en-US&token=Anz84uRE1RULeLwuJ0qKu5amcu5rugRXy1vKc27wUaKVyIv1SVZrUjqaOfXJJoI0",
    }
    const source = new QUADKEYTileSource(tile_options)

    it("should get tiles for extent correctly", () => {
      T.expect_mercator_tile_counts(source)
    })

    it("should convert tile xyz to quadkey", () => {
      expect(source.tile_xyz_to_quadkey(0, 0, 0)).to.be.equal("")
      expect(source.tile_xyz_to_quadkey(0, 0, 1)).to.be.equal("0")
      expect(source.tile_xyz_to_quadkey(0, 0, 2)).to.be.equal("00")
      expect(source.tile_xyz_to_quadkey(20, 30, 10)).to.be.equal("0000032320")
    })

    it("should convert quadkey to tile xyz", () => {
      expect(source.quadkey_to_tile_xyz("")).to.be.equal([0, 0, 0])
      expect(source.quadkey_to_tile_xyz("0")).to.be.equal([0, 0, 1])
      expect(source.quadkey_to_tile_xyz("00")).to.be.equal([0, 0, 2])
      expect(source.quadkey_to_tile_xyz("0000032320")).to.be.equal([20, 30, 10])
    })
  })

  describe("bbox tile source", () => {
    const tile_options = {
      url: "http://maps.ngdc.noaa.gov/soap/web_mercator/dem_hillshades/MapServer/WMSServer?request=GetMap&service=WMS&styles=default&version=1.3.0&format=image/png&bbox={XMIN},{YMIN},{XMAX},{YMAX}&width=256&height=256&crs=3857&layers=DEM%20Hillshades&BGCOLOR=0x000000&transparent=true",
    }
    const source = new BBoxTileSource(tile_options)

    it("should get tiles for extent correctly", () => {
      T.expect_mercator_tile_counts(source)
    })

    it("should handle case-insensitive url parameters (template url)", () => {
      const tile_options0 = {url: "http://mock?bbox={xmin},{ymin},{xmax},{ymax}"}
      const tile_source0 = new BBoxTileSource(tile_options0)
      const url0 = tile_source0.get_image_url(0, 0, 0)
      expect(url0.indexOf("{xmin}")).to.be.equal(-1)
      expect(url0.indexOf("{ymin}")).to.be.equal(-1)
      expect(url0.indexOf("{xmax}")).to.be.equal(-1)
      expect(url0.indexOf("{ymax}")).to.be.equal(-1)

      const tile_options1 = {url: "http://mock?bbox={XMIN},{YMIN},{XMAX},{YMAX}"}
      const tile_source1 = new BBoxTileSource(tile_options1)
      const url1 = tile_source1.get_image_url(0, 0, 0)
      expect(url1.indexOf("{XMIN}")).to.be.equal(-1)
      expect(url1.indexOf("{YMIN}")).to.be.equal(-1)
      expect(url1.indexOf("{XMAX}")).to.be.equal(-1)
      expect(url1.indexOf("{YMAX}")).to.be.equal(-1)
    })
  })

  describe("mercator tile source", () => {
    it("should calculate resolution", () => {
      const source = new MercatorTileSource()
      expect(source.get_resolution(1)).to.be.similar(78271.517)
      expect(source.get_resolution(12)).to.be.similar(38.2185)
    })

    it("should convert tile x,y,z into cache key", () => {
      const source = new MercatorTileSource()
      expect(source.tile_xyz_to_key(1, 1, 1)).to.be.equal("1:1:1")
    })

    it("should convert cache key into tile x,y,z", () => {
      const source = new MercatorTileSource()
      expect(source.key_to_tile_xyz("1:1:1")).to.be.equal([1, 1, 1])
    })

    it("should successfully wrap around (x-axis) for normalized tile coordinates", () => {
      const source = new MercatorTileSource()
      expect(source.normalize_xyz(-1, 1, 2)).to.be.equal([3, 1, 2])
    })

    it("should successfully get closest parent tile by xyz", () => {
      const source = new MercatorTileSource()
      source.tiles.set(source.tile_xyz_to_key(0, 1, 1), {tile_coords: [0, 0, 0]})
      expect(source.get_closest_parent_by_tile_xyz(0, 3, 2)).to.be.equal([0, 1, 1])
    })

    it("should not report a parent tile when none is cached", () => {
      const source = new MercatorTileSource()
      expect(source.get_closest_parent_by_tile_xyz(0, 3, 2)).to.be.null
    })

    it("should retain the most recently used tiles in the cache", () => {
      const source = new MercatorTileSource()
      for (let i = 0; i < 512; i++) {
        source.set_tile(`${i}`, {tile_coords: [i, 0, 0]})
      }
      source.get_tile("0")
      source.set_tile("512", {tile_coords: [512, 0, 0]})

      expect(source.tiles.size).to.be.equal(512)
      expect(source.has_tile("0")).to.be.true
      expect(source.has_tile("1")).to.be.false
      expect(source.has_tile("512")).to.be.true
    })

    it("should not evict tiles the current extent needs", () => {
      const source = new MercatorTileSource()
      const needed = new Set(["0", "1"])
      for (let i = 0; i < 600; i++) {
        source.set_tile(`${i}`, {tile_coords: [i, 0, 0]}, needed)
      }

      expect(source.tiles.size).to.be.equal(512)
      expect(source.has_tile("0")).to.be.true
      expect(source.has_tile("1")).to.be.true
      expect(source.has_tile("2")).to.be.false
    })

    it("should retain an extent that needs more tiles than the cache holds", () => {
      const source = new MercatorTileSource()
      const needed = new Set<string>()
      for (let i = 0; i < 600; i++) {
        needed.add(`${i}`)
      }
      for (const key of needed) {
        source.set_tile(key, {tile_coords: [0, 0, 0]}, needed)
      }

      expect(source.tiles.size).to.be.equal(600)
    })

    it("should verify whether tile xyz's are valid", () => {
      const tile_options0 = {wrap_around: true}
      const source0 = new MercatorTileSource(tile_options0)
      expect(source0.is_valid_tile(-1, 1, 1)).to.be.equal(true)

      const tile_options1 = {wrap_around: false}
      const source1 = new MercatorTileSource(tile_options1)
      expect(source1.is_valid_tile(-1, 1, 1)).to.be.equal(false)
    })

    it("should not snap_to_zoom_level", () => {
      const source = new MercatorTileSource()
      const bounds = source.snap_to_zoom_level(T.MERCATOR_BOUNDS, 400, 400, 2)
      expect(bounds).to.be.similar(T.MERCATOR_BOUNDS)
    })

    it("should snap_to_zoom_level", () => {
      const source = new MercatorTileSource({snap_to_zoom: true})
      const bounds = source.snap_to_zoom_level(T.MERCATOR_BOUNDS, 400, 400, 2)
      expect(bounds).to.be.similar([
        -7827151.69,
        -7827151.69,
        7827151.69,
        7827151.69,
      ], 0.01)
    })

    it("should rescale", () => {
      const source = new MercatorTileSource()
      const rescaled_bounds = source.rescale(T.MERCATOR_BOUNDS, 400, 400, 600, 600)
      expect(rescaled_bounds).to.be.similar([-13358338.8933333, -13358338.8933333, 13358338.8933333, 13358338.8933333])
    })

    it("should rescale and reverse rescale", () => {
      const source = new MercatorTileSource()
      const rescaled_bounds = source.rescale(T.MERCATOR_BOUNDS, 400, 400, 350, 300)
      const reversed_rescaled_bounds = source.rescale(rescaled_bounds, 350, 300, 400, 400)
      expect(reversed_rescaled_bounds).to.be.equal(T.MERCATOR_BOUNDS)
    })

    it("should get best zoom level based on extent and height/width", () => {
      const source = new MercatorTileSource()
      expect(source.get_level_by_extent(T.MERCATOR_BOUNDS, 256, 256)).to.be.equal(0)
      expect(source.get_level_by_extent(T.MERCATOR_BOUNDS, 512, 512)).to.be.equal(1)
      expect(source.get_level_by_extent(T.MERCATOR_BOUNDS, 1024, 1024)).to.be.equal(2)
    })

    it("should get last zoom level as best when there are no others", () => {
      const source = new MercatorTileSource()
      expect(source.get_level_by_extent(T.MERCATOR_BOUNDS, 1e40, 1e40)).to.be.equal(30)
    })

    it("should get closest zoom level based on extent and height/width", () => {
      const source = new MercatorTileSource()
      expect(source.get_closest_level_by_extent(T.MERCATOR_BOUNDS, 256, 256)).to.be.equal(0)
      expect(source.get_closest_level_by_extent(T.MERCATOR_BOUNDS, 513, 512)).to.be.equal(1)
      expect(source.get_closest_level_by_extent(T.MERCATOR_BOUNDS, 1024, 1024)).to.be.equal(2)
    })

    it("should get zoom levels within the range the source provides", () => {
      const source = new MercatorTileSource({min_zoom: 5, max_zoom: 10})

      expect(source.get_level_by_extent(T.MERCATOR_BOUNDS, 256, 256)).to.be.equal(5)
      expect(source.get_closest_level_by_extent(T.MERCATOR_BOUNDS, 256, 256)).to.be.equal(5)

      expect(source.get_level_by_extent([0, 0, 100, 100], 256, 256)).to.be.equal(10)
      expect(source.get_closest_level_by_extent([0, 0, 100, 100], 256, 256)).to.be.equal(10)
    })

    it("should constrain the extent to a single resolution in both axes", () => {
      const source = new MercatorTileSource()

      const wide = source.constrain_extent([-1000000, -500000, 1000000, 500000], 400, 400)
      expect(wide).to.be.similar([-1000000, -1000000, 1000000, 1000000])

      const tall = source.constrain_extent([-500000, -1000000, 500000, 1000000], 400, 400)
      expect(tall).to.be.similar([-1000000, -1000000, 1000000, 1000000])

      // an extent that already is consistent is left alone
      expect(source.constrain_extent(wide, 400, 400)).to.be.equal(wide)
      // the extent grows, so that what was asked for stays visible
      expect(source.constrain_extent(T.MERCATOR_BOUNDS, 200, 400)).to.be.similar([
        -40075016.68, -20037508.34, 40075016.68, 20037508.34,
      ])
    })

    it("should not return children beyond the levels the source provides", () => {
      const source = new MercatorTileSource({max_zoom: 2})
      expect(source.children_by_tile_xyz(0, 0, 1).length).to.be.equal(4)
      expect(source.children_by_tile_xyz(0, 0, 2)).to.be.equal([])
    })

    it("should limit the number of tiles requested for an extent", () => {
      const source = new MercatorTileSource()
      const tiles = source.get_tiles_by_extent(T.MERCATOR_BOUNDS, 12, 0)
      expect(tiles.length).to.be.equal(4096)
    })

    it("should convert pixel x/y to tile x/y", () => {
      const source = new MercatorTileSource()
      expect(source.pixels_to_tile(1, 1)).to.be.equal([0, 0])
      expect(source.pixels_to_tile(0, 0)).to.be.equal([0, 0])
      expect(source.pixels_to_tile(-1, -1)).to.be.equal([-1, -1])
      expect(source.pixels_to_tile(-256, -256)).to.be.equal([-1, -1])
      expect(source.pixels_to_tile(-257, 257)).to.be.equal([-2, 1])
    })

    it("should convert pixel x/y to meters x/y", () => {
      const source = new MercatorTileSource()
      expect(source.pixels_to_meters(0, 0, 0)).to.be.equal([-20037508.34, -20037508.34])
    })

    it("should get tile bounds in meters", () => {
      const source = new MercatorTileSource()
      const bounds = source.get_tile_meter_bounds(511, 1202, 11)
      expect(bounds).to.be.similar([
        -10038322.050635627,
        3483082.504898913,
        -10018754.171394622,
        3502650.384139918,
      ], 0.01)
    })

    it("should get tile bounds in lat/lng", () => {
      const source = new MercatorTileSource()
      const bounds = source.get_tile_geographic_bounds(511, 1202, 11)
      expect(bounds).to.be.similar([
        -90.17578125,
        29.840643899834436,
        -90,
        29.99300228455108,
      ], 0.01)
    })

    // XXX: This test was completely broken before rewrite.
    //      Now it at least compiles, but is still broken.
    it.skip("should get tile urls by geographic extent", () => {
      const tile_options = {
        url: "http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png",
      }

      const source = new TMSTileSource(tile_options)

      const extent: Extent = [-90.283741, 29.890626, -89.912952, 30.057766]
      const level = 11

      const expected_tiles = [
        "http://c.tile.openstreetmap.org/11/510/1201.png",
        "http://c.tile.openstreetmap.org/11/511/1201.png",
        "http://c.tile.openstreetmap.org/11/512/1201.png",
        "http://c.tile.openstreetmap.org/11/510/1202.png",
        "http://c.tile.openstreetmap.org/11/511/1202.png",
        "http://c.tile.openstreetmap.org/11/512/1202.png",
      ]

      const tiles = source.get_tiles_by_extent(extent, level)
      for (const [x, y, z] of tiles) {
        const url = source.get_image_url(x, y, z)
        expect(expected_tiles.includes(url)).to.be.true
      }
    })
  })
})

describe("tile renderer", () => {
  // only zoom levels 1 and 2 are available as local assets
  function osm_source(): WMTSTileSource {
    return new WMTSTileSource({url: "/assets/tiles/osm/{Z}_{X}_{Y}.png", max_zoom: 2})
  }

  function relative_aspect_error(view: PlotView, x_range: Range, y_range: Range): number {
    const {width, height} = view.frame.bbox
    const x_resolution = (x_range.end - x_range.start)/width
    const y_resolution = (y_range.end - y_range.start)/height
    return Math.abs(x_resolution/y_resolution - 1)
  }

  it("should draw tiles at a single resolution in both axes", async () => {
    const x_range = new Range1d({start: -2000000, end: 6000000})
    const y_range = new Range1d({start: -1000000, end: 7000000})

    const plot = fig([300, 200], {
      x_range, y_range,
      x_axis_type: "mercator",
      y_axis_type: "mercator",
      renderers: [new TileRenderer({tile_source: osm_source()})],
    })

    const {view} = await display(plot)

    expect(relative_aspect_error(view, x_range, y_range)).to.be.below(1e-5)
    // a Range1d isn't auto-ranged, so nothing has to be frozen to keep the aspect
    expect(x_range.have_updated_interactively).to.be.false
    expect(y_range.have_updated_interactively).to.be.false
  })

  it("should stop auto-ranging in order to keep tiles undistorted", async () => {
    const source = new ColumnDataSource({data: {x: [-2000000, 6000000], y: [-1000000, 7000000]}})
    const x_range = new DataRange1d()
    const y_range = new DataRange1d()

    const plot = fig([300, 200], {
      x_range, y_range,
      x_axis_type: "mercator",
      y_axis_type: "mercator",
      renderers: [new TileRenderer({tile_source: osm_source()})],
    })
    plot.scatter({field: "x"}, {field: "y"}, {source})

    const {view} = await display(plot)

    expect(relative_aspect_error(view, x_range, y_range)).to.be.below(1e-5)

    // an auto-ranged range would re-fit to the data on every paint and undo the
    // aspect constraint, so the tile renderer deliberately takes the range over,
    // as pan and zoom tools do; a distorted map is never the better outcome
    expect(x_range.have_updated_interactively).to.be.true
    expect(y_range.have_updated_interactively).to.be.true

    const [x_start, x_end] = [x_range.start, x_range.end]
    const [y_start, y_end] = [y_range.start, y_range.end]

    source.data = {x: [-15000000, 15000000], y: [-1000000, 7000000]}
    await view.ready

    // consequence of the above: the ranges no longer follow the data
    expect([x_range.start, x_range.end]).to.be.equal([x_start, x_end])
    expect([y_range.start, y_range.end]).to.be.equal([y_start, y_end])
  })

  it("should keep tile requests in flight out of the bounded cache", async () => {
    const tile_source = osm_source()
    const tile_renderer = new TileRenderer({tile_source})

    const plot = fig([300, 200], {
      x_range: [-2000000, 6000000],
      y_range: [-1000000, 7000000],
      x_axis_type: "mercator",
      y_axis_type: "mercator",
      renderers: [tile_renderer],
    })

    const {view} = await display(plot)
    const renderer_view = view.owner.get_one(tile_renderer) as any

    const [x, y, z] = [0, 0, 1]
    const key = tile_source.tile_xyz_to_key(x, y, z)
    const bounds = tile_source.get_tile_meter_bounds(x, y, z)
    tile_source.delete_tile(key)

    renderer_view._create_tile(x, y, z, bounds)
    // a tile that is being loaded can't be evicted, so its request can't be
    // lost, and the number of attempts made for it can't reset
    expect(tile_source.has_tile(key)).to.be.false
    expect(renderer_view._pending.get(key).attempts).to.be.equal(1)

    renderer_view._create_tile(x, y, z, bounds)
    expect(renderer_view._pending.get(key).attempts).to.be.equal(1)

    for (let i = 0; i < 100 && renderer_view._pending.size != 0; i++) {
      await delay(10)
    }

    // once the image arrives the tile is cached, and thus available for drawing
    expect(renderer_view._pending.size).to.be.equal(0)
    expect(tile_source.has_tile(key)).to.be.true
  })
})
