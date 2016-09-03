{expect} = require "chai"
utils = require "../../utils"

ColumnDataSource = utils.require("models/sources/column_data_source").Model
DataSource = utils.require("models/sources/data_source").Model
Glyph = utils.require("models/glyphs/glyph").Model
GlyphRenderer = utils.require("models/renderers/glyph_renderer").Model


describe "GlyphRenderer Model", ->

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


  describe "get_labels_from_glyph_label_prop", ->

    it "should return labels if field is valid", ->
      glyph = new Glyph({'label': {'field': 'label'}})
      @gr.glyph = glyph
      field = @gr.get_labels_from_glyph_label_prop()
      expect(field).to.be.deep.equal ['foo', 'bar']

    it "should return 'Invalid field' list if field is not valid", ->
      glyph = new Glyph({'label': {'field': 'milk'}})
      @gr.glyph = glyph
      field = @gr.get_labels_from_glyph_label_prop()
      expect(field).to.be.deep.equal ['Invalid field']

    it "should return value in single list if label is value", ->
      glyph = new Glyph({'label': {'value': 'milk'}})
      @gr.glyph = glyph
      field = @gr.get_labels_from_glyph_label_prop()
      expect(field).to.be.deep.equal ['milk']

    it "should return empty list if label is null", ->
      glyph = new Glyph({'label': null})
      @gr.glyph = glyph
      field = @gr.get_labels_from_glyph_label_prop()
      expect(field).to.be.deep.equal []


  describe "get_field_from_glyph_label_prop", ->

    it "should return undefined if label property is null", ->
      glyph = new Glyph({'label': null})
      @gr.glyph = glyph
      field = @gr.get_field_from_glyph_label_prop()
      expect(field).to.be.undefined

    it "should return undefined if label property is value", ->
      glyph = new Glyph({'label': {'value': 'milk'}})
      @gr.glyph = glyph
      field = @gr.get_field_from_glyph_label_prop()
      expect(field).to.be.undefined

    it "should return field if label property is field", ->
      glyph = new Glyph({'label': {'field': 'milk'}})
      @gr.glyph = glyph
      field = @gr.get_field_from_glyph_label_prop()
      expect(field).to.be.equal 'milk'


