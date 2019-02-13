import {expect} from "chai"
import * as sinon from 'sinon'

import {ColumnDataSource} from "models/sources/column_data_source"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {Legend} from "models/annotations/legend"
import {LegendView} from "models/annotations/legend"
import {LegendItem} from "models/annotations/legend_item"

describe("Legend", () => {

  describe("get_legend_names", () => {

    it("should return the results of get_labels_from_glyph_label_prop", () => {
      const source = new ColumnDataSource({
        data: {
          label: ['l1', 'l2', 'l2', 'l1'],
        },
      })
      const gr = new GlyphRenderer({data_source: source})
      const item_1 = new LegendItem({label: {field: 'label'}, renderers: [gr]})
      const item_2 = new LegendItem({label: {value: 'l3'}})

      const legend = new Legend({
        items: [item_1, item_2],
      })
      const labels = legend.get_legend_names()
      expect(labels).to.be.deep.equal(['l1', 'l2', 'l3'])
    })
  })
})

describe("LegendView", () => {

  const WIDTH = 222
  const HEIGHT = 333

  let stub: sinon.SinonStub

  beforeEach(() => {
    stub = sinon.stub(LegendView.prototype, 'compute_legend_bbox')
    stub.returns({x: 0, y: 0, width: WIDTH, height: HEIGHT})
  })

  afterEach(() => {
    stub.reset()
  })

  it("get_size should return legend dimensions", () => {
    const legend = new Legend()
    const legend_view = new legend.default_view({model: legend, parent: null})
    expect(legend_view.get_size()).to.be.deep.equal({width: WIDTH+20, height: HEIGHT+20})
  })
})
