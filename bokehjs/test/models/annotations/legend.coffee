{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

SidePanel = utils.require("core/layout/side_panel").Model

{Document} = utils.require "document"

Legend = utils.require("models/annotations/legend").Model

HEIGHT = 333
WIDTH = 222

describe "Legend.View", ->

  beforeEach ->
    @legend = new Legend()
    @legend.attach_document(new Document())

  it "_get_size should return legend_height if side is above", ->
    @legend.add_panel('above')
    legend_view = new @legend.default_view({ model: @legend })
    legend_view._bbox = {x: 0, y: 0, w: WIDTH, h: HEIGHT}
    expect(legend_view._get_size()).to.be.equal HEIGHT

  it "_get_size should return legend_height if side is below", ->
    @legend.add_panel('below')
    legend_view = new @legend.default_view({ model: @legend })
    legend_view._bbox = {x: 0, y: 0, w: WIDTH, h: HEIGHT}
    expect(legend_view._get_size()).to.be.equal HEIGHT

  it "_get_size should return legend_height if side is left", ->
    @legend.add_panel('left')
    legend_view = new @legend.default_view({ model: @legend })
    legend_view._bbox = {x: 0, y: 0, w: WIDTH, h: HEIGHT}
    expect(legend_view._get_size()).to.be.equal WIDTH

  it "_get_size should return legend_height if side is right", ->
    @legend.add_panel('right')
    legend_view = new @legend.default_view({ model: @legend })
    legend_view._bbox = {x: 0, y: 0, w: WIDTH, h: HEIGHT}
    expect(legend_view._get_size()).to.be.equal WIDTH
