

side_length = 200

make_range = (num_points) ->
  step = side_length / num_points
  data = ({'x' : pt, 'y' : pt} for pt in _.range(0, side_length, step))
  return data

data_set = make_range(1000)



canvas_t =  ()->
  expect(0)
  
  can1 = $('canvas#can1')[0]
  ctx = can1.getContext('2d')
  point = (pt) ->
     ctx.fillRect(pt.x, pt.y, 5, 5)
  for pt in data_set
    point(pt)
  ctx.stroke()


kinetic_t = ()->
  expect(0)
  stage = new Kinetic.Stage
    #container: @canvas[0]
    container: $('#container')[0]
    width: 200
    height: 200
  layer = new Kinetic.Layer()
  for pt in data_set
    layer.add(new Kinetic.RegularPolygon(
      fill: 'red'
      sides: 4
      x:pt.x
      y:pt.y
      radius: 5
      strokeWidth: 3))
  stage.add(layer)

kinetic_t2 = ()->
  expect(0)
  stage = new Kinetic.Stage
    container: $('#container2')[0]
    width: 200
    height: 200
  layer = new Kinetic.Layer()
  pts = []
  for pt in data_set
    pt = new Kinetic.RegularPolygon(
      fill: 'red'
      sides: 4
      x:pt.x
      y:pt.y
      radius: 5
      strokeWidth: 3)
    pts.push(pt)
    layer.add(pt)
    
  window.pts=pts
  stage.add(layer)
  window.doMove = ->
    layer.clear()
    #layer = new Kinetic.Layer()
    for pt in pts
      pos = pt.getPosition()
      pt.setPosition(pos.x+30, pos.y)
      layer.add(pt)
    ""
    #stage.add(layer)
    layer.draw()

  

window.canvas_t = canvas_t
window.kinetic_t = kinetic_t

test('test_raw_canvas', canvas_t)
test('test_raw_kinetic', kinetic_t)
test('test_raw_kinetic2', kinetic_t2)
