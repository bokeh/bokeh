import {expect} from "#framework/assertions"
import * as sinon from "sinon"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {LegendItem} from "@bokehjs/models/annotations/legend_item"
import {logger} from "@bokehjs/core/logging"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"

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
      const stub = sinon.stub(LegendItem.prototype, "_check_data_sources_on_renderers").returns(false)
      LegendItem.create()
      sinon.assert.calledOnce(logger_stub)
      stub.restore()
    })

    it("should log an error if _check_field_label_on_data_source is false", () => {
      const stub = sinon.stub(LegendItem.prototype, "_check_field_label_on_data_source").returns(false)
      LegendItem.create()
      sinon.assert.calledOnce(logger_stub)
      stub.restore()
    })
  })

  describe("_check_data_sources_on_renderers", () => {

    it("should return false if field label and different data sources", () => {
      const gr_1 = GlyphRenderer.create({data_source: ColumnDataSource.create()})
      const gr_2 = GlyphRenderer.create({data_source: ColumnDataSource.create()})
      const legend_item = LegendItem.create({
        label: {field: "label"},
        renderers: [ gr_1, gr_2 ],
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.false
    })

    it("should return false if field label and no renderers", () => {
      const legend_item = LegendItem.create({
        label: {field: "label"},
        renderers: [ ],
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.false
    })

    it("should return true if value label and different data sources", () => {
      const gr_1 = GlyphRenderer.create({data_source: ColumnDataSource.create()})
      const gr_2 = GlyphRenderer.create({data_source: ColumnDataSource.create()})
      const legend_item = LegendItem.create({
        label: {value: "label"},
        renderers: [ gr_1, gr_2 ],
      })
      expect(legend_item._check_data_sources_on_renderers()).to.be.true
    })
  })

  describe("_check_field_label_on_data_source", () => {

    it("should return false if field label and label not in data source", () => {
      const gr_1 = GlyphRenderer.create({
        data_source: ColumnDataSource.create({data: {foo: [1]}}),
      })
      const legend_item = LegendItem.create({
        label: {field: "label"},
        renderers: [ gr_1 ],
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.false
    })

    it("should return false if field label and no renderers", () => {
      const legend_item = LegendItem.create({
        label: {field: "label"},
        renderers: [ ],
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.false
    })

    it("should return true if field label and label in data source", () => {
      const gr_1 = GlyphRenderer.create({
        data_source: ColumnDataSource.create({data: {label: [1]}}),
      })
      const legend_item = LegendItem.create({
        label: {field: "label"},
        renderers: [ gr_1 ],
      })
      expect(legend_item._check_field_label_on_data_source()).to.be.true
    })
  })

  describe("get_field_from_label_prop", () => {

    it("should return undefined if label property is null", () => {
      const legend_item = LegendItem.create({label: null})
      const field = legend_item.get_field_from_label_prop()
      expect(field).to.be.null
    })

    it("should return undefined if label property is value", () => {
      const legend_item = LegendItem.create({label: {value: "milk"}})
      const field = legend_item.get_field_from_label_prop()
      expect(field).to.be.null
    })

    it("should return field if label property is field", () => {
      const legend_item = LegendItem.create({label: {field: "milk"}})
      const field = legend_item.get_field_from_label_prop()
      expect(field).to.be.equal("milk")
    })
  })

  describe("get_labels_list_from_label_prop", () => {
    it("reads shaped label fields by logical row after filtering", () => {
      const source = ColumnDataSource.create({data: {label: new Float64NDArray([1, 2, 3, 4, 5, 6], [3, 2])}})
      const renderer = GlyphRenderer.create({data_source: source})
      renderer.view.filter = IndexFilter.create({indices: [1, 2]})
      renderer.view.compute_indices(source)
      const item = LegendItem.create({label: {field: "label"}, renderers: [renderer]})
      const labels: unknown[] = item.get_labels_list_from_label_prop()
      expect(labels).to.be.equal([[3, 4], [5, 6]])
      expect(renderer.view.get_reference_point(source.get("label"), labels[0])).to.be.equal(0)
      expect(renderer.view.get_reference_point(source.get("label"), labels[1])).to.be.equal(1)
    })

    for (const [storage, data] of Object.entries({
      shaped: new Float64NDArray([1, 2, 1, 2, 3, 4], [3, 2]),
      nested: [[1, 2], [1, 2], [3, 4]],
    })) {
      it(`merges repeated ${storage} labels and uses the first visible reference point`, () => {
        const source = ColumnDataSource.create({data: {label: data}})
        const renderer = GlyphRenderer.create({data_source: source})
        renderer.view.compute_indices(source)
        const item = LegendItem.create({label: {field: "label"}, renderers: [renderer]})
        const labels = item.get_labels_list_from_label_prop()
        expect(labels).to.be.equal([[1, 2], [3, 4]])
        expect(renderer.view.get_reference_point(source.get("label"), labels[0])).to.be.equal(0)
        expect(renderer.view.get_reference_point(source.get("label"), labels[1])).to.be.equal(2)
        renderer.view.filter = IndexFilter.create({indices: [1, 2]})
        renderer.view.compute_indices(source)
        const filtered = item.get_labels_list_from_label_prop()
        expect(filtered).to.be.equal([[1, 2], [3, 4]])
        expect(renderer.view.get_reference_point(source.get("label"), filtered[0])).to.be.equal(0)
        expect(renderer.view.get_reference_point(source.get("label"), filtered[1])).to.be.equal(1)
      })
    }

    it("retains numeric field values for legend glyph lookup", () => {
      const source = ColumnDataSource.create({data: {label: [10, 20, 10]}})
      const renderer = GlyphRenderer.create({data_source: source})
      renderer.view.compute_indices(source)
      const item = LegendItem.create({label: {field: "label"}, renderers: [renderer]})
      const labels = item.get_labels_list_from_label_prop()
      expect(labels).to.be.equal([10, 20])
      expect(renderer.view.get_reference_point(source.get("label"), labels[1])).to.be.equal(1)
    })

    it("merges equal object values and NaN using the first visible reference point", () => {
      const source = ColumnDataSource.create({data: {label: [{x: [1, 2]}, {x: [1, 2]}, {x: [3, 4]}, NaN, NaN]}})
      const renderer = GlyphRenderer.create({data_source: source})
      renderer.view.compute_indices(source)
      const item = LegendItem.create({label: {field: "label"}, renderers: [renderer]})
      const labels = item.get_labels_list_from_label_prop()
      expect(labels).to.be.equal([{x: [1, 2]}, {x: [3, 4]}, NaN])
      expect(labels.map((value) => renderer.view.get_reference_point(source.get("label"), value))).to.be.equal([0, 2, 3])

      renderer.view.filter = IndexFilter.create({indices: [1, 2, 4]})
      renderer.view.compute_indices(source)
      const filtered = item.get_labels_list_from_label_prop()
      expect(filtered).to.be.equal(labels)
      expect(filtered.map((value) => renderer.view.get_reference_point(source.get("label"), value))).to.be.equal([0, 1, 2])
    })

    it("should return empty labels if visible is false", () => {
      const source = ColumnDataSource.create({
        data: {
          label: ["foo", "bar", "foo", "bar"],
        },
      })
      const gr = GlyphRenderer.create({data_source: source})
      gr.view.compute_indices(source)
      const legend_item = LegendItem.create({label: {field: "label"}, renderers: [gr], visible: false})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal([])
    })

    it("should return labels if field is valid", () => {
      const source = ColumnDataSource.create({
        data: {
          label: ["foo", "bar", "foo", "bar"],
        },
      })
      const gr = GlyphRenderer.create({data_source: source})
      gr.view.compute_indices(source)
      const legend_item = LegendItem.create({label: {field: "label"}, renderers: [gr]})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(["foo", "bar"])
    })

    it("should return 'Invalid field' list if field is not in datasource", () => {
      const source = ColumnDataSource.create({
        data: {
          x: [10, 20, 30, 40],
        },
      })
      const gr = GlyphRenderer.create({data_source: source})
      gr.view.compute_indices(source)
      const legend_item = LegendItem.create({label: {field: "milk"}, renderers: [gr]})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(["Invalid field"])
    })

    it("should return 'No source found' list if no renderer and field used", () => {
      const legend_item = LegendItem.create({label: {field: "milk"}, renderers: []})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(["No source found"])
    })

    it("should return value in single list if label is value", () => {
      const legend_item = LegendItem.create({label: {value: "milk"}})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal(["milk"])
    })

    it("should return empty list if label is null", () => {
      const legend_item = LegendItem.create({label: null})
      const field = legend_item.get_labels_list_from_label_prop()
      expect(field).to.be.equal([])
    })
  })
})
