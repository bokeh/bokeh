{expect} = require "chai"
utils = require "../utils"

canvas = utils.require "common/canvas"

describe "Canvas Model", ->

  beforeEach ->
    @height = 400
    @cm = new canvas.Model({'canvas_height': @height, 'canvas_width': 400})

  it "v_vx_to_sx should return what it is passed", ->
    xx = new Float64Array(72.72, 87.87, 224.24, 209.09)
    expect(@cm.v_vx_to_sx(xx)).to.eql(xx)

  it "v_vy_to_sy should make y relative to canvas height less 1 px", ->
    data_yy = [10.0, 20.0, 30.0]
    screen_yy = [@height - data_yy[0] - 1, @height - data_yy[1] - 1, @height - data_yy[2] - 1]
    expect(@cm.v_vy_to_sy(data_yy)).to.eql(screen_yy)

  it "v_sx_to_vx should return what it is passed", ->
    xx = new Float64Array(72.72, 87.87, 224.24, 209.09)
    expect(@cm.v_sx_to_vx(xx)).to.eql(xx)

  it "v_sy_to_vy should convert back to data_yy", ->
    data_yy = [10.0, 20.0, 30.0]
    screen_yy = [@height - data_yy[0] - 1, @height - data_yy[1] - 1, @height - data_yy[2] - 1]
    expect(@cm.v_sy_to_vy(screen_yy)).to.eql(data_yy)
