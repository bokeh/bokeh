import {expect} from "assertions"

import {shuffle} from "@bokehjs/core/util/array"
import {TileSource} from "@bokehjs/models/tiles/tile_source"
import {MercatorTileSource} from "@bokehjs/models/tiles/mercator_tile_source"
import {TMSTileSource} from "@bokehjs/models/tiles/tms_tile_source"
import {WMTSTileSource} from "@bokehjs/models/tiles/wmts_tile_source"
import {QUADKEYTileSource} from "@bokehjs/models/tiles/quadkey_tile_source"
import {BBoxTileSource} from "@bokehjs/models/tiles/bbox_tile_source"
import * as tile_utils from "@bokehjs/models/tiles/tile_utils"
import {Extent} from "@bokehjs/models/tiles/tile_utils"

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
      url: 'http://c.tiles.mapbox.com/v3/examples.map-szwdot65/{Z}/{X}/{Y}.png',
    }

    const source = new AbstractTileSource(tile_options)

    it("should convert tile xyz into a tile key", () => {
      const k = source.tile_xyz_to_key(1, 1, 1)
      expect(k).to.be.equal("1:1:1")
    })

    it("should convert tile key to tile xyz", () => {
      const xyz = source.key_to_tile_xyz('1:1:1')
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
        test_key: 'test_value',
        test_key2: 'test_value2',
      }

      const tile_options = {
        url: 'http://{test_key}/{test_key2}/{X}/{Y}/{Z}.png',
        extra_url_vars: test_extra_url_vars,
      }

      const tile_source = new AbstractTileSource(tile_options)
      const expect_url = 'http://test_value/test_value2/0/0/0.png'
      expect(tile_source.extra_url_vars).to.be.equal(test_extra_url_vars)
      expect(tile_source.get_image_url(0, 0, 0)).to.be.equal(expect_url)
    })

    it("should handle case-insensitive url parameters (template url)", () => {
      const expect_url = 'http://mock/0/0/0.png'

      const tile_options0 = {
        url: 'http://mock/{x}/{y}/{z}.png',
      }
      const tile_source0 = new AbstractTileSource(tile_options0)
      expect(tile_source0.get_image_url(0, 0, 0)).to.be.equal(expect_url)

      const tile_options1 = {
        url: 'http://mock/{X}/{Y}/{Z}.png',
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
        url: 'http://mock/{x}/{y}/{z}.png',
      }
      const tile_source = new AbstractTileSource(tile_options)
      const tile = {tile_coords: [0, 1, 2]}
      tile_source.tiles.mock_key = tile
      tile_source.url = 'http://mock/{x}/{y}/{z}.png'
      expect(tile_source.tiles).to.be.empty
    })
  })

  describe("tms tile source", () => {
    const url = 'http://c.tiles.mapbox.com/v3/examples.map-szwdot65/{Z}/{X}/{Y}.png'
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
      url: 'http://mt0.google.com/vt/lyrs=m@169000000&hl=en&x={X}&y={Y}&z={Z}&s=Ga',
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
      url: 'http://t0.tiles.virtualearth.net/tiles/a{Q}.jpeg?g=854&mkt=en-US&token=Anz84uRE1RULeLwuJ0qKu5amcu5rugRXy1vKc27wUaKVyIv1SVZrUjqaOfXJJoI0',
    }
    const source = new QUADKEYTileSource(tile_options)

    it("should get tiles for extent correctly", () => {
      T.expect_mercator_tile_counts(source)
    })

    it("should convert tile xyz to quadkey", () => {
      expect(source.tile_xyz_to_quadkey(0, 0, 0)).to.be.equal('')
      expect(source.tile_xyz_to_quadkey(0, 0, 1)).to.be.equal('0')
      expect(source.tile_xyz_to_quadkey(0, 0, 2)).to.be.equal('00')
      expect(source.tile_xyz_to_quadkey(20, 30, 10)).to.be.equal('0000032320')
    })

    it("should convert quadkey to tile xyz", () => {
      expect(source.quadkey_to_tile_xyz('')).to.be.equal([0, 0, 0])
      expect(source.quadkey_to_tile_xyz('0')).to.be.equal([0, 0, 1])
      expect(source.quadkey_to_tile_xyz('00')).to.be.equal([0, 0, 2])
      expect(source.quadkey_to_tile_xyz('0000032320')).to.be.equal([20, 30, 10])
    })
  })

  describe("bbox tile source", () => {
    const tile_options = {
      url: 'http://maps.ngdc.noaa.gov/soap/web_mercator/dem_hillshades/MapServer/WMSServer?request=GetMap&service=WMS&styles=default&version=1.3.0&format=image/png&bbox={XMIN},{YMIN},{XMAX},{YMAX}&width=256&height=256&crs=3857&layers=DEM%20Hillshades&BGCOLOR=0x000000&transparent=true',
    }
    const source = new BBoxTileSource(tile_options)

    it("should get tiles for extent correctly", () => {
      T.expect_mercator_tile_counts(source)
    })

    it("should handle case-insensitive url parameters (template url)", () => {
      const tile_options0 = {url: 'http://mock?bbox={xmin},{ymin},{xmax},{ymax}'}
      const tile_source0 = new BBoxTileSource(tile_options0)
      const url0 = tile_source0.get_image_url(0, 0, 0)
      expect(url0.indexOf('{xmin}')).to.be.equal(-1)
      expect(url0.indexOf('{ymin}')).to.be.equal(-1)
      expect(url0.indexOf('{xmax}')).to.be.equal(-1)
      expect(url0.indexOf('{ymax}')).to.be.equal(-1)

      const tile_options1 = {url: 'http://mock?bbox={XMIN},{YMIN},{XMAX},{YMAX}'}
      const tile_source1 = new BBoxTileSource(tile_options1)
      const url1 = tile_source1.get_image_url(0, 0, 0)
      expect(url1.indexOf('{XMIN}')).to.be.equal(-1)
      expect(url1.indexOf('{YMIN}')).to.be.equal(-1)
      expect(url1.indexOf('{XMAX}')).to.be.equal(-1)
      expect(url1.indexOf('{YMAX}')).to.be.equal(-1)
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

    it("should convert pixel x/y to tile x/y", () => {
      const source = new MercatorTileSource()
      expect(source.pixels_to_tile(1, 1)).to.be.equal([0, 0])
      expect(source.pixels_to_tile(0, 0)).to.be.equal([0, 0])
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
        url: 'http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png',
      }

      const source = new TMSTileSource(tile_options)

      const extent: Extent = [-90.283741, 29.890626, -89.912952, 30.057766]
      const level = 11

      const expected_tiles = [
        'http://c.tile.openstreetmap.org/11/510/1201.png',
        'http://c.tile.openstreetmap.org/11/511/1201.png',
        'http://c.tile.openstreetmap.org/11/512/1201.png',
        'http://c.tile.openstreetmap.org/11/510/1202.png',
        'http://c.tile.openstreetmap.org/11/511/1202.png',
        'http://c.tile.openstreetmap.org/11/512/1202.png',
      ]

      const tiles = source.get_tiles_by_extent(extent, level)
      for (const [x, y, z] of tiles) {
        const url = source.get_image_url(x, y, z)
        expect(expected_tiles.includes(url)).to.be.true
      }
    })
  })
})
