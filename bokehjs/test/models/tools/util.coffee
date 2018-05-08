{expect} = require "chai"

{compute_renderers} = require("models/tools/util")
{GlyphRenderer} = require("models/renderers/glyph_renderer")
{GraphRenderer} = require("models/renderers/graph_renderer")

g = new GlyphRenderer({name: "g"})
g2 = new GlyphRenderer({name: "g2"})
gr = new GraphRenderer({name: "gr"})

describe "compute_renderers", ->

  it "should return empty list for renderers=null", ->
    r = compute_renderers(null, [], [])
    expect(r).to.be.deep.equal []

    r = compute_renderers(null, [g, g2, gr], [])
    expect(r).to.be.deep.equal []

    r = compute_renderers(null, [g, g2, gr], ["g2"])
    expect(r).to.be.deep.equal []

  it "should return empty list for renderers=[]", ->
    r = compute_renderers([], [], [])
    expect(r).to.be.deep.equal []

    r = compute_renderers([], [g, g2, gr], [])
    expect(r).to.be.deep.equal []

    r = compute_renderers([], [g, g2, gr], ["g2"])
    expect(r).to.be.deep.equal []

  it "should return all_renderers for renderers='auto'", ->
    r = compute_renderers('auto', [g, g2, gr], [])
    expect(r).to.be.deep.equal [g, g2, gr]

  it "should filter renderers by names", ->
    r = compute_renderers([g, g2], [g, g2, gr], ["g"])
    expect(r).to.be.deep.equal [g]

    r = compute_renderers([g, g2, gr], [], ["g", "gr"])
    expect(r).to.be.deep.equal [g, gr]

    r = compute_renderers('auto', [g, g2, gr], ["g", "gr"])
    expect(r).to.be.deep.equal [g, gr]
