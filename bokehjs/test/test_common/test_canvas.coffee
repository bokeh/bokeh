{expect} = require "chai"
utils = require "../utils"

canvas = utils.require "common/canvas"

describe "Canvas Model", ->
  
  it "v_vx_to_sx should return what it is passed", ->
    cm = new canvas.Model({'canvas_height': 400, 'canvas_width': 400})
    xx = new Float64Array(72.72, 87.87, 224.24, 209.09)
    expect(cm.v_vx_to_sx(xx)).to.eql(xx)

  it "v_vy_to_sy should make y relative to canvas height less 1 px", ->
    height = 400
    cm = new canvas.Model({'canvas_height': height, 'canvas_width': 100})
    yy = [10.0, 20.0, 30.0]
    expected_yy = [height - yy[0] - 1, height - yy[1] - 1, height - yy[2] - 1]
    expect(cm.v_vy_to_sy(yy)).to.eql(expected_yy)
