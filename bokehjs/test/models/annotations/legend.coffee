{expect} = require "chai"
sinon = require 'sinon'

{SidePanel} = require("core/layout/side_panel")

{ColumnDataSource} = require("models/sources/column_data_source")
{GlyphRenderer} = require("models/renderers/glyph_renderer")
{Legend} = require("models/annotations/legend")
{LegendView} = require("models/annotations/legend")
{LegendItem} = require("models/annotations/legend_item")

describe "Legend", ->

  describe "get_legend_names", ->

    it "should return the results of get_labels_from_glyph_label_prop", ->
      source = new ColumnDataSource({
        data: {
          label: ['l1', 'l2', 'l2', 'l1']
        },
        selection_manager: null,
      })
      gr = new GlyphRenderer({'data_source': source})
      item_1 = new LegendItem({'label': {'field': 'label'}, 'renderers': [gr]})
      item_2 = new LegendItem({'label': {'value': 'l3'}})

      legend = new Legend({
        items: [item_1, item_2]
      })
      labels = legend.get_legend_names()
      expect(labels).to.be.deep.equal ['l1', 'l2', 'l3']


describe "LegendView", ->

  WIDTH = 222
  HEIGHT = 333

  it "get_size should return legend dimensions", sinon.test () ->
    legend = new Legend()
    stub = this.stub(LegendView.prototype, 'compute_legend_bbox')
    stub.returns({x: 0, y: 0, width: WIDTH, height: HEIGHT})

    legend_view = new legend.default_view({model: legend})
    expect(legend_view.get_size()).to.be.deep.equal({width: WIDTH+20, height: HEIGHT+20})
