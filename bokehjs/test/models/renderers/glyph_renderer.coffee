{expect} = require "chai"
utils = require "../../utils"

{ColumnDataSource} = utils.require("models/sources/column_data_source")
{DataSource} = utils.require("models/sources/data_source")
{Glyph} = utils.require("models/glyphs/glyph")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")

describe "GlyphRenderer", ->

  beforeEach ->
    @source = new ColumnDataSource({
      data: {
        x: [10, 20, 30, 40],
        y:[1, 2, 3, 4],
        color: ['red', 'green', 'red', 'green'],
        label: ['foo', 'bar', 'foo', 'bar']
      }
    })
    @gr = new GlyphRenderer({'data_source': @source})

  describe "get_reference_point", ->

    it "should return 0 if no field, value is passed", ->
      index = @gr.get_reference_point()
      expect(index).to.be.equal 0

    it "should return 0 if field not in column data source", ->
      index = @gr.get_reference_point('milk', 'bar')
      expect(index).to.be.equal 0

    it "should return correct index if field and value in column data source", ->
      index = @gr.get_reference_point('label', 'bar')
      expect(index).to.be.equal 1

    it "should return 0 index if field in column data source but value not available", ->
      index = @gr.get_reference_point('label', 'baz')
      expect(index).to.be.equal 0

    it "should return 0 if data_source doesn't have get_column method", ->
      source = new DataSource()
      gr = new GlyphRenderer({'data_source': source})
      index = gr.get_reference_point('label', 20)
      expect(index).to.be.equal 0
