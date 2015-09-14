_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"

base = utils.require "common/base"
Geo = utils.require "renderer/geo/tile_layer"

describe "Projection Utils", ->

  utils = new Geo.ProjectionUtils()
  tol = 0.01

  it "should convert lat/lng to meters", ->
    [x, y] = utils.geographic_to_meters(-90.17578125, 29.840643899834436)
    expect(x).to.be.closeTo(-10038322.050635627, tol)
    expect(y).to.be.closeTo(3483082.504898913, tol)

  it "should convert meters to lat/lng", ->
    [x, y] = utils.meters_to_geographic(-10038322.050635627, 3483082.504898913)
    expect(x).to.be.closeTo(-90.17578125, tol)
    expect(y).to.be.closeTo(29.840643899834436, tol)

  it "should convert geographic extent to meters", ->
    extent = [-67.5, -21.943045533438166, -45, 0]
    bounds = utils.geographic_extent_to_meters(extent)
    expect(bounds[0]).to.be.closeTo(-7514065.628545966, tol)
    expect(bounds[1]).to.be.closeTo(-2504688.542848654, tol)
    expect(bounds[2]).to.be.closeTo(-5009377.085697312, tol)
    expect(bounds[3]).to.be.closeTo(0, tol)

  it "should convert meters extent to geographic", ->
    extent = [-7514065.628545966, -2504688.542848654, -5009377.085697312, 0]
    bounds = utils.meters_extent_to_geographic(extent)
    expect(bounds[0]).to.be.closeTo(-67.5, tol)
    expect(bounds[1]).to.be.closeTo(-21.943045533438166, tol)
    expect(bounds[2]).to.be.closeTo(-45, tol)
    expect(bounds[3]).to.be.closeTo(0, tol)

describe "TMS tile provider", ->
  url = 'http://c.tiles.mapbox.com/v3/examples.map-szwdot65/{Z}/{X}/{Y}.png'
  provider = new Geo.TMSTileProvider(url)
  [xmin, ymin, xmax, ymax, level] = [ -6359560.753324973, -4422981.796518583, 10136161.446837958, 5067439.635366378, 3]

  it "should get tiles for extent correctly", ->
    tiles = provider.get_tiles_by_extent(xmin, ymin, xmax, ymax, level)
    expect(tiles.length).to.be.equal 8

describe "GOOGLE tile provider", ->
  url = 'http://services.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer/tile/{Z}/{Y}/{X}'
  provider = new Geo.GeographicTMSTileProvider(url, 512)
  [xmin, ymin, xmax, ymax, level] = [-90.283741, 29.890626, -89.912952, 30.057766, 11]

  it "should get tiles for extent correctly", ->
    tiles = provider.get_tiles_by_extent(xmin, ymin, xmax, ymax, level)
    expect(tiles.length).to.be.equal 6

describe "QUADKEY tile provider", ->
  url = 'http://t0.tiles.virtualearth.net/tiles/a{QUADKEY}.jpeg?g=854&mkt=en-US&token=Anz84uRE1RULeLwuJ0qKu5amcu5rugRXy1vKc27wUaKVyIv1SVZrUjqaOfXJJoI0'
  provider = new Geo.QUADKEYTileProvider(url)
  [xmin, ymin, xmax, ymax, level] = [ -6359560.753324973, -4422981.796518583, 10136161.446837958, 5067439.635366378, 3]

  it "should get tiles for extent correctly", ->
    tiles = provider.get_tiles_by_latlng_extent(xmin, ymin, xmax, ymax, level)
    expect(tiles.length).to.be.equal 8

  it "should convert tile xyz to quadkey", ->
    expect(provider.tile_xyz_to_quadkey(0, 0, 0)).to.be.equal('')
    expect(provider.tile_xyz_to_quadkey(0, 0, 1)).to.be.equal('0')
    expect(provider.tile_xyz_to_quadkey(0, 0, 2)).to.be.equal('00')
    expect(provider.tile_xyz_to_quadkey(20, 30, 10)).to.be.equal('0000032320')

  it "should convert quadkey to tile xyz", ->
    expect(provider.quadkey_to_tile_xyz('')).to.be.eql [0, 0, 0]
    expect(provider.quadkey_to_tile_xyz('0')).to.be.eql [0, 0, 1]
    expect(provider.quadkey_to_tile_xyz('00')).to.be.eql [0, 0, 2]
    expect(provider.quadkey_to_tile_xyz('0000032320')).to.be.eql [20, 30, 10]

describe "GEOGRAPHIC TMS tile provider", ->
  url = 'http://services.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer/tile/{Z}/{Y}/{X}'
  provider = new Geo.GeographicTMSTileProvider(url, 512)
  [xmin, ymin, xmax, ymax, level] = [-90.283741, 29.890626, -89.912952, 30.057766, 11]

  it "should get tiles for extent correctly", ->
    tiles = provider.get_tiles_by_extent(xmin, ymin, xmax, ymax, level)
    expect(tiles.length).to.be.equal 6

describe "GEOGRAPHIC tile provider", ->

  provider = new Geo.GeographicTileProvider()
  tol = 0.01

  it "should convert lat/lng to pixel x/y", ->
    expect(provider.geographic_to_pixels(0, 0, 0)).to.be.eql [128,128]
    expect(provider.geograpihic_to_pixels(0, 0, 1)).to.be.eql [256,256]
    expect(provider.geographic_to_pixels(0, 0, 2)).to.be.eql [512,512]

  it "should convert lng/lat to tile x/y", ->
    expect(provider.latlng_to_tilexy(0, 0, 1)).to.be.eql [1, 1]

describe "MERCATOR tile provider", ->

  provider = new Geo.MercatorTileProvider()
  tol = 0.01

  it "should calculate resolution", ->
    expect(provider.get_resolution(1)).to.be.closeTo(78271.517, tol)
    expect(provider.get_resolution(12)).to.be.closeTo(38.2185, tol)

  it "should convert pixel x/y to lat/lng", ->
    [lat, lng] = tile_utils.pixelxy_to_latlng(0, 0, 0)
    expect(lat).to.be.equal(-180)
    expect(lng).to.be.closeTo(85.05, 0.01)

  it "should convert pixel x/y to tile x/y", ->
    expect(tile_utils.pixels_to_tile(0, 0)).to.be.eql [0,0]

  it "should convert lat/lng to meters", ->
    [x, y] = provider.geographic_to_meters(-90.17578125, 29.840643899834436)
    expect(x).to.be.closeTo(-10038322.050635627, tol)
    expect(y).to.be.closeTo(3483082.504898913, tol)

  it "should convert meters to lat/lng", ->
    [x, y] = provider.meters_to_geographic(-10038322.050635627, 3483082.504898913)
    expect(x).to.be.closeTo(-90.17578125, tol)
    expect(y).to.be.closeTo(29.840643899834436, tol)

  it "should get tile bounds in meters", ->
    bounds = provider.get_tile_meter_bounds(511, 845, 11)
    expect(bounds[0]).to.be.closeTo(-10038322.050635627, tol)
    expect(bounds[1]).to.be.closeTo(3483082.504898913, tol)
    expect(bounds[2]).to.be.closeTo(-10018754.171394622, tol)
    expect(bounds[3]).to.be.closeTo(3502650.384139918, tol)

  it "should get tile bounds in lat/lng", ->
    bounds = provider.get_tile_geographic_bounds(511, 845, 11)
    expect(bounds[0]).to.be.closeTo(-90.17578125, tol)
    expect(bounds[1]).to.be.closeTo(29.840643899834436, tol)
    expect(bounds[2]).to.be.closeTo(-90, tol)
    expect(bounds[3]).to.be.closeTo(29.99300228455108, tol)

  it "should get tile urls by geographic extent", ->
    service = 'http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png'
    provider = new Geo.TMSTileProvider(service)

    [xmin, ymin, xmax, ymax, level] = [-90.283741, 29.890626, -89.912952,
                                        30.057766, 11]
    expected_tiles = []
    expected_tiles.push('http://c.tile.openstreetmap.org/11/510/844.png')
    expected_tiles.push('http://c.tile.openstreetmap.org/11/511/844.png')
    expected_tiles.push('http://c.tile.openstreetmap.org/11/512/844.png')
    expected_tiles.push('http://c.tile.openstreetmap.org/11/510/845.png')
    expected_tiles.push('http://c.tile.openstreetmap.org/11/511/845.png')
    expected_tiles.push('http://c.tile.openstreetmap.org/11/512/845.png')

    urls = provider.get_tiles_by_extent(xmin, ymin, xmax, ymax, level)
    for url in expected_tiles
      expect(expected_tiles.indexOf(url)).to.be.above -1
