_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"

base = utils.require "common/base"
Geo = utils.require "renderer/geo/tile_layer"

describe "tile utilities module", ->

  tile_utils = new Geo.Utils()
  tol = 0.01

  it "should clip high value to max", ->
    expect(tile_utils.clip_value(100, 1, 10)).to.be.equal 10

  it "should clip low value to min", ->
    expect(tile_utils.clip_value(-100, 1, 10)).to.be.equal 1

  it "should get map dimensions by zoom level", ->
    expect(tile_utils.get_map_dimensions_by_zoom_level(0)).to.be.equal 256
    expect(tile_utils.get_map_dimensions_by_zoom_level(1)).to.be.equal 512
    expect(tile_utils.get_map_dimensions_by_zoom_level(2)).to.be.equal 1024
    expect(tile_utils.get_map_dimensions_by_zoom_level(3)).to.be.equal 2048

  it "should calculate ground resolution", ->
    expect(tile_utils.get_ground_resolution(0, 1)).to.be.closeTo(78271.5170, tol)
    expect(tile_utils.get_ground_resolution(0, 12)).to.be.closeTo(38.2185, tol)

  it "should get map scale", ->
    expect(tile_utils.get_map_scale(0, 1)).to.be.closeTo(295829355.45, tol)
    expect(tile_utils.get_map_scale(0, 12)).to.be.closeTo(144447.93, tol)

  it "should convert lat/lng to pixel x/y", ->
    expect(tile_utils.convert_latlng_to_pixelxy(0, 0, 0)).to.be.eql [128,128]
    expect(tile_utils.convert_latlng_to_pixelxy(0, 0, 1)).to.be.eql [256,256]
    expect(tile_utils.convert_latlng_to_pixelxy(0, 0, 2)).to.be.eql [512,512]

  it "should convert pixel x/y to lat/lng", ->
    [lat, lng] = tile_utils.convert_pixelxy_to_latlng(0, 0, 0)
    expect(lat).to.be.equal(-180)
    expect(lng).to.be.closeTo(85.05, 0.01)

  it "should convert pixel x/y to tile x/y", ->
    expect(tile_utils.convert_pixelxy_to_tilexy(0, 0)).to.be.eql [0,0]

  it "should convert tile x/y to pixel x/y", ->
    expect(tile_utils.convert_pixelxy_to_tilexy(0, 0)).to.be.eql [0,0]

  it "should convert tile xyz to quadkey", ->
    expect(tile_utils.tile_xyz_to_quadkey(0, 0, 0)).to.be.equal('')
    expect(tile_utils.tile_xyz_to_quadkey(0, 0, 1)).to.be.equal('0')
    expect(tile_utils.tile_xyz_to_quadkey(0, 0, 2)).to.be.equal('00')
    expect(tile_utils.tile_xyz_to_quadkey(20, 30, 10)).to.be.equal('0000032320')

  it "should convert quadkey to tile xyz", ->
    expect(tile_utils.quadkey_to_tile_xyz('')).to.be.eql [0, 0, 0]
    expect(tile_utils.quadkey_to_tile_xyz('0')).to.be.eql [0, 0, 1]
    expect(tile_utils.quadkey_to_tile_xyz('00')).to.be.eql [0, 0, 2]
    expect(tile_utils.quadkey_to_tile_xyz('0000032320')).to.be.eql [20, 30, 10]

  it "should convert lng/lat to tile x/y", ->
    expect(tile_utils.convert_latlng_to_tilexy(0, 0, 1)).to.be.eql [1, 1]

  it "should get tile origin", ->
    [lat, lng] = tile_utils.get_tile_origin(0, 0, 1)
    expect(lat).to.be.closeTo(85.05, tol)
    expect(lng).to.be.closeTo(-180, tol)
