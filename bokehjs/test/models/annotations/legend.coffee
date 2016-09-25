{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

SidePanel = utils.require("core/layout/side_panel").Model

{Document} = utils.require "document"

Legend = utils.require("models/annotations/legend").Model
LegendView = utils.require("models/annotations/legend").View
LegendItem = utils.require("models/annotations/legend_item")

HEIGHT = 333
WIDTH = 222

describe "Legend.Model", ->

  describe "get_legend_names", ->

    it "should return the results of get_labels_from_glyph_label_prop", ->
      gr_1 = new LegendItem()
      sinon.stub(gr_1, "get_labels_list_from_label_prop", () -> ['l1', 'l2'])
      gr_2 = new LegendItem()
      sinon.stub(gr_2, "get_labels_list_from_label_prop", () -> ['l3'])

      legend = new Legend({
        items: [gr_1, gr_2]
      })
      labels = legend.get_legend_names()
      expect(labels).to.be.deep.equal ['l1', 'l2', 'l3']


describe "Legend.View", ->

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
