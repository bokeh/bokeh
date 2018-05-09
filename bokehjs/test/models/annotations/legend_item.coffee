{expect} = require "chai"
sinon = require 'sinon'

{ColumnDataSource} = require("models/sources/column_data_source")
{GlyphRenderer} = require("models/renderers/glyph_renderer")
{LegendItem} = require("models/annotations/legend_item")
{logger} = require("core/logging")

describe "LegendItem", ->

  describe "initialize", ->
    afterEach ->
      @sandbox.restore()

    beforeEach ->
      @sandbox = sinon.sandbox.create()
      @sandbox.stub(logger, "error")

    it "should log an error if _check_data_sources_on_renderers is false", ->
      sinon.stub(LegendItem.prototype, '_check_data_sources_on_renderers').returns(false)
      legend_item = new LegendItem()
      sinon.assert.calledOnce(logger.error)
      LegendItem.prototype._check_data_sources_on_renderers.restore()

    it "should log an error if _check_field_label_on_data_source is false", ->
      sinon.stub(LegendItem.prototype, '_check_field_label_on_data_source').returns(false)
      legend_item = new LegendItem()
      sinon.assert.calledOnce(logger.error)
      LegendItem.prototype._check_field_label_on_data_source.restore()

  describe "_check_data_sources_on_renderers", ->

    it "should return false if field label and different data sources", ->
      gr_1 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      gr_2 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ gr_1, gr_2 ]
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.false

    it "should return false if field label and no renderers", ->
      legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ ]
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.false

    it "should return true if value label and different data sources", ->
      gr_1 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      gr_2 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      legend_item = new LegendItem({
        label: { value: 'label' },
        renderers: [ gr_1, gr_2 ]
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.true

  describe "_check_field_label_on_data_source", ->

    it "should return false if field label and label not in data source", ->
      gr_1 = new GlyphRenderer({
        data_source: new ColumnDataSource({data: {foo: [1]}})
      })
      legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ gr_1 ]
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.false

    it "should return false if field label and no renderers", ->
      legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ ]
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.false

    it "should return true if field label and label in data source", ->
      gr_1 = new GlyphRenderer({
        data_source: new ColumnDataSource({data: {label: [1]}})
      })
      legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ gr_1 ]
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.true

  describe "get_field_from_label_prop", ->

    it "should return undefined if label property is null", ->
      legend_item = new LegendItem({label: null})
      field = legend_item.get_field_from_label_prop()
      expect(field).to.be.null

    it "should return undefined if label property is value", ->
      legend_item = new LegendItem({label: {value: 'milk'}})
      field = legend_item.get_field_from_label_prop()
      expect(field).to.be.null

    it "should return field if label property is field", ->
      legend_item = new LegendItem({label: {field: 'milk'}})
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
      legend_item = new LegendItem({label: {field: 'label'}, 'renderers': [gr]})
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
      legend_item = new LegendItem({label: {field: 'milk'}, 'renderers': [gr]})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['Invalid field']

    it "should return 'No source found' list if no renderer and field used", ->
      legend_item = new LegendItem({label: {field: 'milk'}, 'renderers': []})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['No source found']

    it "should return 'No source found' list if no source on renderer", ->
      gr = new GlyphRenderer()
      legend_item = new LegendItem({label: {field: 'milk'}, 'renderers': [gr]})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['No source found']

    it "should return value in single list if label is value", ->
      legend_item = new LegendItem({label: {value: 'milk'}})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal ['milk']

    it "should return empty list if label is null", ->
      legend_item = new LegendItem({label: null})
      field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.deep.equal []
