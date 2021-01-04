import {expect} from "assertions"
//import * as sinon from 'sinon'

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Legend} from "@bokehjs/models/annotations/legend"
//import {LegendView} from "@bokehjs/models/annotations/legend"
import {LegendItem} from "@bokehjs/models/annotations/legend_item"
//import {build_view} from "@bokehjs/core/build_views"

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
      expect(labels).to.be.equal(['l1', 'l2', 'l3'])
    })
  })
})

/* TODO
describe("LegendView", () => {

  const WIDTH = 222
  const HEIGHT = 333

  let stub: sinon.SinonStub

  before_each(() => {
    stub = sinon.stub(LegendView.prototype, 'compute_legend_bbox')
    stub.returns({x: 0, y: 0, width: WIDTH, height: HEIGHT})
  })

  after_each(() => {
    stub.reset()
  })

  it("get_size should return legend dimensions", async () => {
    const legend = new Legend()
    const legend_view = await build_view(legend)
    expect(legend_view.get_size()).to.be.equal({width: WIDTH+20, height: HEIGHT+20})
  })
})
*/
