{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{SidePanel} = utils.require("core/layout/side_panel")

{Document} = utils.require "document"

{ColumnDataSource} = utils.require("models/sources/column_data_source")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{Legend} = utils.require("models/annotations/legend")
{LegendView} = utils.require("models/annotations/legend")
{LegendItem} = utils.require("models/annotations/legend_item")

HEIGHT = 333
WIDTH = 222

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

  afterEach ->
    LegendView.prototype.compute_legend_bbox.restore()

  beforeEach ->
    @legend = new Legend()
    @legend.attach_document(new Document())
    stub = sinon.stub(LegendView.prototype, 'compute_legend_bbox')
    stub.returns({x: 0, y: 0, width: WIDTH, height: HEIGHT})

  it "_get_size should return legend_height if side is above", ->
    @legend.add_panel('above')
    legend_view = new @legend.default_view({ model: @legend })
    expect(legend_view._get_size()).to.be.equal HEIGHT

  it "_get_size should return legend_height if side is below", ->
    @legend.add_panel('below')
    legend_view = new @legend.default_view({ model: @legend })
    expect(legend_view._get_size()).to.be.equal HEIGHT

  it "_get_size should return legend_height if side is left", ->
    @legend.add_panel('left')
    legend_view = new @legend.default_view({ model: @legend })
    expect(legend_view._get_size()).to.be.equal WIDTH

  it "_get_size should return legend_height if side is right", ->
    @legend.add_panel('right')
    legend_view = new @legend.default_view({ model: @legend })
    expect(legend_view._get_size()).to.be.equal WIDTH
