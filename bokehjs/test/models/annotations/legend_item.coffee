{expect} = require "chai"
utils = require "../../utils"

ColumnDataSource = utils.require("models/sources/column_data_source").Model
GlyphRenderer = utils.require("models/renderers/glyph_renderer").Model
LegendItem = utils.require("models/annotations/legend_item").Model

describe "LegendItem", ->

  describe "get_field_from_label_prop", ->

    it "should return undefined if label property is null", ->
      legend_item = new LegendItem({'label': null})
      field = legend_item.get_field_from_label_prop()
      expect(field).to.be.undefined

    it "should return undefined if label property is value", ->
      legend_item = new LegendItem({'label': {'value': 'milk'}})
      field = legend_item.get_field_from_label_prop()
      expect(field).to.be.undefined

    it "should return field if label property is field", ->
      legend_item = new LegendItem({'label': {'field': 'milk'}})
      field = legend_item.get_field_from_label_prop()
      expect(field).to.be.equal 'milk'

  describe "get_labels_list_from_label_prop", ->

    it "should return labels if field is valid", ->
      source = new ColumnDataSource({
        data: {
          label: ['foo', 'bar', 'foo', 'bar']
        },
        selection_manager: null,
      })
      gr = new GlyphRenderer({'data_source': source})
      legend_item = new LegendItem({'label': {'field': 'label'}, 'renderers': [gr]})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['foo', 'bar']

    it "should return 'Invalid field' list if field is not in datasource", ->
      source = new ColumnDataSource({
        data: {
          x: [10, 20, 30, 40],
        },
        selection_manager: null,
      })
      gr = new GlyphRenderer({'data_source': source})
      legend_item = new LegendItem({'label': {'field': 'milk'}, 'renderers': [gr]})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['Invalid field']

    it "should return 'No source found' list if no renderer and field used", ->
      legend_item = new LegendItem({'label': {'field': 'milk'}, 'renderers': []})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['No source found']

    it "should return 'No source found' list if no source on renderer", ->
      gr = new GlyphRenderer()
      legend_item = new LegendItem({'label': {'field': 'milk'}, 'renderers': [gr]})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['No source found']

    it "should return value in single list if label is value", ->
      legend_item = new LegendItem({'label': {'value': 'milk'}})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['milk']

    it "should return empty list if label is null", ->
      legend_item = new LegendItem({'label': null})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal []
