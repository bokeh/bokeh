_ = require "underscore"
{expect} = require "chai"
utils = require "../utils"

canvas = utils.require "common/canvas"

describe "Canvas Model", ->

  beforeEach ->
    @height = 400
    @cm = new canvas.Model({'canvas_height': @height, 'canvas_width': 400})

  it "vx_to_sx should return what it is passed", ->
    x = 12
    expect(@cm.vx_to_sx(x)).to.eql(x)

  it "vy_to_sy should make y relative to height less 1px", ->
    view_y = 12
    expect(@cm.vy_to_sy(view_y)).to.eql(@height - view_y - 1)

  it "v_vx_to_sx should return what it is passed", ->
    xx = new Float64Array([72.72, 87.87, 224.24, 209.09])
    expect(@cm.v_vx_to_sx(xx)).to.eql(xx)

  it "v_vy_to_sy should make y relative to canvas height less 1 px", ->
    view_yy = [10.0, 20.0, 30.0]
    screen_yy = new Float64Array([@cm.vy_to_sy(view_yy[0]), @cm.vy_to_sy(view_yy[1]), @cm.vy_to_sy(view_yy[2])])
    expect(@cm.v_vy_to_sy(view_yy)).to.eql(screen_yy)

  it "v_vy_to_sy should handle nested arrays", ->
    view_yy_outer = [10.0, 20.0, 30.0]
    view_yy_inner = [40.0, 50.0]
    screen_yy_outer = new Float64Array([@cm.vy_to_sy(view_yy_outer[0]), @cm.vy_to_sy(view_yy_outer[1]), @cm.vy_to_sy(view_yy_outer[2])])
    screen_yy_inner = new Float64Array([@cm.vy_to_sy(view_yy_inner[0]), @cm.vy_to_sy(view_yy_inner[1])])
    expect(@cm.v_vy_to_sy([[view_yy_outer, view_yy_inner]])).to.eql([[screen_yy_outer, screen_yy_inner]])

  it "sx_to_vx should return what it is passed", ->
    x = 12
    expect(@cm.sx_to_vx(x)).to.eql(x)

  it "sy_to_vy should convert screen y back to view y", ->
    view_y = 12
    screen_y = @height - view_y - 1
    expect(@cm.sy_to_vy(screen_y)).to.eql(view_y)

  it "v_sx_to_vx should return what it is passed", ->
    xx = new Float64Array([72.72, 87.87, 224.24, 209.09])
    expect(@cm.v_sx_to_vx(xx)).to.eql(xx)

  it "v_sy_to_vy should convert back to view_yy", ->
    view_yy = [10.0, 20.0, 30.0]
    screen_yy = new Float64Array([@cm.vy_to_sy(view_yy[0]), @cm.vy_to_sy(view_yy[1]), @cm.vy_to_sy(view_yy[2])])
    expect(@cm.v_sy_to_vy(screen_yy)).to.eql(new Float64Array(view_yy))

  it "v_sy_to_vy should handle nested arrays", ->
    view_yy_outer = [10.0, 20.0, 30.0]
    view_yy_inner = [40.0, 50.0]
    screen_yy_outer = new Float64Array([@cm.vy_to_sy(view_yy_outer[0]), @cm.vy_to_sy(view_yy_outer[1]), @cm.vy_to_sy(view_yy_outer[2])])
    screen_yy_inner = new Float64Array([@cm.vy_to_sy(view_yy_inner[0]), @cm.vy_to_sy(view_yy_inner[1])])
    expect(@cm.v_sy_to_vy([[screen_yy_outer, screen_yy_inner]])).to.eql([[new Float64Array(view_yy_outer), new Float64Array(view_yy_inner)]])
