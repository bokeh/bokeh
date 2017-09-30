{expect} = require "chai"
utils = require "../../utils"

proj4 = utils.require "core/util/proj4"

describe "proj4 module", ->

  it "mercator_bounds should match official EPSG:3857 bounds", ->
    expect(proj4.mercator_bounds.lon).to.deep.equal [-20026376.39, 20026376.39]
    expect(proj4.mercator_bounds.lat).to.deep.equal [-20048966.10, 20048966.10]

  it "clip_mercator should not clip valid longitudes", ->
    expect(proj4.clip_mercator(-10018754, 10018754, 'lon')).to.deep.equal [-10018754, 10018754]

  it "clip_mercator should clip invalid longitudes", ->
    expect(proj4.clip_mercator(-20036376, 20036376, 'lon')).to.deep.equal [-20026376.39, 20026376.39]

  it "clip_mercator should clip invalid longitude lower bound", ->
    expect(proj4.clip_mercator(-20036376, 10018754, 'lon')).to.deep.equal [-20026376.39, 10018754]

  it "clip_mercator should clip invalid longitude upper bound", ->
    expect(proj4.clip_mercator(-10018754, 20036376, 'lon')).to.deep.equal [-10018754, 20026376.39]

  it "clip_mercator should not clip valid latitudes", ->
    expect(proj4.clip_mercator(-5621521, 5621521, 'lat')).to.deep.equal [-5621521, 5621521]

  it "clip_mercator should clip invalid latitudes", ->
    expect(proj4.clip_mercator(-20058966, 20058966, 'lat')).to.deep.equal [-20048966.10, 20048966.10]

  it "clip_mercator should clip invalid latitude lower bound", ->
    expect(proj4.clip_mercator(-20058966, 5621521, 'lat')).to.deep.equal [-20048966.10, 5621521]

  it "clip_mercator should clip invalid latitude upper bound", ->
    expect(proj4.clip_mercator(-5621521, 20058966, 'lat')).to.deep.equal [-5621521, 20048966.10]
