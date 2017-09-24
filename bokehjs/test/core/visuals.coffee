{expect} = require "chai"
utils = require "../utils"

{Visuals} = utils.require "core/visuals"
{ColumnDataSource} = utils.require "models/sources/column_data_source"
{Circle} = utils.require "models/glyphs/circle"

describe "Visuals", ->

  it "should set the correct visual values when values are vectorized", ->
    source = new ColumnDataSource({data: {
        "fill_alpha": [0, 0.5, 1]
    }})
    attrs =
      fill_alpha: {"field": "fill_alpha"}

    circle = new Circle(attrs)
    visuals = new Visuals(circle)

    visuals.warm_cache(source)

    ctx = {}
    visuals.fill.set_vectorize(ctx, 1)
    expect(ctx.globalAlpha).to.be.equal(0.5)

  it "should set the correct visual values when values are vectorized and all_indices is set", ->
    source = new ColumnDataSource({data: {
        "fill_alpha": [0, 0.5, 1]
    }})
    attrs =
      fill_alpha: {"field": "fill_alpha"}

    circle = new Circle(attrs)
    visuals = new Visuals(circle)

    visuals.warm_cache(source)
    visuals.set_all_indices([1, 2])

    ctx = {}
    visuals.fill.set_vectorize(ctx, 1)
    expect(ctx.globalAlpha).to.be.equal(1)
