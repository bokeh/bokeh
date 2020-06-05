import {expect} from "assertions"
import * as sinon from 'sinon'

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {LegendItem} from "@bokehjs/models/annotations/legend_item"
import {logger} from "@bokehjs/core/logging"

describe("LegendItem", () => {

  describe("initialize", () => {
    let logger_stub: sinon.SinonStub

    before_each(() => {
      logger_stub = sinon.stub(logger, "error")
    })

    after_each(() => {
      logger_stub.restore()
    })

    it("should log an error if _check_data_sources_on_renderers is false", () => {
      const stub = sinon.stub(LegendItem.prototype, '_check_data_sources_on_renderers').returns(false)
      new LegendItem()
      sinon.assert.calledOnce(logger_stub)
      stub.restore()
    })

    it("should log an error if _check_field_label_on_data_source is false", () => {
      const stub = sinon.stub(LegendItem.prototype, '_check_field_label_on_data_source').returns(false)
      new LegendItem()
      sinon.assert.calledOnce(logger_stub)
      stub.restore()
    })
  })

  describe("_check_data_sources_on_renderers", () => {

    it("should return false if field label and different data sources", () => {
      const gr_1 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      const gr_2 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      const legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ gr_1, gr_2 ],
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.false
    })

    it("should return false if field label and no renderers", () => {
      const legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ ],
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.false
    })

    it("should return true if value label and different data sources", () => {
      const gr_1 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      const gr_2 = new GlyphRenderer({ data_source: new ColumnDataSource() })
      const legend_item = new LegendItem({
        label: { value: 'label' },
        renderers: [ gr_1, gr_2 ],
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.true
    })
  })

  describe("_check_field_label_on_data_source", () => {

    it("should return false if field label and label not in data source", () => {
      const gr_1 = new GlyphRenderer({
        data_source: new ColumnDataSource({data: {foo: [1]}}),
      })
      const legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ gr_1 ],
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.false
    })

    it("should return false if field label and no renderers", () => {
      const legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ ],
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.false
    })

    it("should return true if field label and label in data source", () => {
      const gr_1 = new GlyphRenderer({
        data_source: new ColumnDataSource({data: {label: [1]}}),
      })
      const legend_item = new LegendItem({
        label: { field: 'label' },
        renderers: [ gr_1 ],
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.true
    })
  })

  describe("get_field_from_label_prop", () => {

    it("should return undefined if label property is null", () => {
      const legend_item = new LegendItem({label: null})
      const field = legend_item.get_field_from_label_prop()
      expect(field).to.be.null
    })

    it("should return undefined if label property is value", () => {
      const legend_item = new LegendItem({label: {value: 'milk'}})
      const field = legend_item.get_field_from_label_prop()
      expect(field).to.be.null
    })

    it("should return field if label property is field", () => {
      const legend_item = new LegendItem({label: {field: 'milk'}})
      const field = legend_item.get_field_from_label_prop()
      expect(field).to.be.equal('milk')
    })
  })

  describe("get_labels_list_from_label_prop", () => {

    it("should return labels if field is valid", () => {
      const source = new ColumnDataSource({
        data: {
          label: ['foo', 'bar', 'foo', 'bar'],
        },
      })
      const gr = new GlyphRenderer({data_source: source})
      const legend_item = new LegendItem({label: {field: 'label'}, renderers: [gr]})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(['foo', 'bar'])
    })

    it("should return 'Invalid field' list if field is not in datasource", () => {
      const source = new ColumnDataSource({
        data: {
          x: [10, 20, 30, 40],
        },
      })
      const gr = new GlyphRenderer({data_source: source})
      const legend_item = new LegendItem({label: {field: 'milk'}, renderers: [gr]})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(['Invalid field'])
    })

    it("should return 'No source found' list if no renderer and field used", () => {
      const legend_item = new LegendItem({label: {field: 'milk'}, renderers: []})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(['No source found'])
    })

    it("should return 'No source found' list if no source on renderer", () => {
      const gr = new GlyphRenderer()
      const legend_item = new LegendItem({label: {field: 'milk'}, renderers: [gr]})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(['No source found'])
    })

    it("should return value in single list if label is value", () => {
      const legend_item = new LegendItem({label: {value: 'milk'}})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(['milk'])
    })

    it("should return empty list if label is null", () => {
      const legend_item = new LegendItem({label: null})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal([])
    })
  })
})
