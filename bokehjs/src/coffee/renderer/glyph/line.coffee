_ = require "underscore"
gloo2 = require "gloo2"
Glyph = require "./glyph"
hittest = require "../../common/hittest"

class LineView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @_gl?
        return  # performance

  _set_data: () ->
    @_data_changed = true  # notify gl, lazy upload

  _render: (ctx, indices, {sx, sy}) ->
    if ctx.glcanvas
        return @_render_gl(ctx, indices)

    drawing = false
    @visuals.line.set_value(ctx)  # what does this do?

    for i in indices
      if !isFinite(sx[i]+sy[i]) and drawing
        ctx.stroke()
        ctx.beginPath()
        drawing = false
        continue

      if drawing
        ctx.lineTo(sx[i], sy[i])
      else
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        drawing = true

    if drawing
      ctx.stroke()

  _render_gl: (ctx, indices) ->    
    gl = ctx.glcanvas.gl
    if not @_gl?
      @_gl = setup_gl(gl)

    if @_data_changed
      @_data_changed = false
      @_gl.vbo_x.set_size(@x.length * 4)  # size in bytes
      @_gl.vbo_y.set_size(@y.length * 4)
      @_gl.vbo_x.set_data(0, new Float32Array(@x))
      @_gl.vbo_y.set_data(0, new Float32Array(@y))      

    [dx, dy] = @renderer.map_to_screen([0, 1], [0, 1])    
    @_gl.prog.set_uniform('u_canvas_size', 'vec2', [ctx.glcanvas.width, ctx.glcanvas.height])
    @_gl.prog.set_uniform('u_offset', 'vec2', [dx[0], dy[0]])
    @_gl.prog.set_uniform('u_scale', 'vec2', [dx[1]-dx[0], dy[1]-dy[0]])

    # todo: use indices
    @_gl.prog.draw(gl.LINE_STRIP, [0, @x.length])

  _hit_point: (geometry) ->
    ### Check if the point geometry hits this line glyph and return an object
    that describes the hit result:
      Args:
        * geometry (object): object with the following keys
          * vx (float): view x coordinate of the point
          * vy (float): view y coordinate of the point
          * type (str): type of geometry (in this case it's a point)
      Output:
        Object with the following keys:
          * 0d (bool): whether the point hits the glyph or not
          * 1d (array(int)): array with the indices hit by the point
    ###
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xmapper.map_from_target(vx)
    y = @renderer.ymapper.map_from_target(vy)
    result = hittest.create_hit_test_result()
    point = {x: x, y: y}
    shortest = 100
    threshold = 1

    for i in [0...@x.length-1]
      [p0, p1] = [{x: @x[i], y: @y[i]}, {x: @x[i+1], y: @y[i+1]}]
      dist = hittest.dist_to_segment(point, p0, p1)

      if dist < threshold && dist < shortest
        shortest = dist
        result['0d'].flag = true
        result['0d'].indices = [i]

    return result

  _hit_span: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    result = hittest.create_hit_test_result()

    if geometry.direction == 'v'
      val = @renderer.ymapper.map_from_target(vy)
      values = @y
    else
      val = @renderer.xmapper.map_from_target(vx)
      values = @x

    for i in [0...values.length-1]
      if values[i]<=val<=values[i+1]
        result['0d'].flag = true
        result['0d'].indices.push(i)

    return result

  get_interpolation_hit: (i, geometry)->
    [vx, vy] = [geometry.vx, geometry.vy]
    [x2, y2, x3, y3] = [@x[i], @y[i], @x[i+1], @y[i+1]]

    if geometry.type == 'point'
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy-1, vy+1])
      [x0, x1] = @renderer.xmapper.v_map_from_target([vx-1, vx+1])
    else
      if geometry.direction == 'v'
        [y0, y1] = @renderer.ymapper.v_map_from_target([vy, vy])
        [x0, x1] = [x2, x3]
      else
        [x0, x1] = @renderer.xmapper.v_map_from_target([vx, vx])
        [y0, y1] = [y2, y3]

    res = hittest.check_2_segments_intersect(x0, y0, x1, y1, x2, y2, x3, y3)
    return [res.x, res.y]

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Line extends Glyph.Model
  default_view: LineView
  type: 'Line'
  visuals: ['line']


setup_gl = (gl) ->
  # This function sets up the visualization to render a line

  VERT = """
  precision mediump float;
  attribute float a_x;
  attribute float a_y;
  uniform vec2 u_canvas_size;
  uniform vec2 u_offset;
  uniform vec2 u_scale;
  void main() {
      vec2 pos = vec2(a_x, a_y) * u_scale + u_offset; // in pixels
      pos /= u_canvas_size;  // in 0..1
      gl_Position = vec4(pos*2.0-1.0, 0.0, 1.0);
      gl_Position.y *= -1.0;
  }"""

  FRAG = """
  precision mediump float;
  uniform vec4 u_color;
  void main() {      
      gl_FragColor = u_color;
      gl_FragColor.a = 1.0;
  }"""
    
  prog = new gloo2.Program(gl)
  prog.set_shaders(VERT, FRAG)
  vbo_x = new gloo2.VertexBuffer(gl)
  prog.set_attribute('a_x', 'float', [vbo_x, 0, 0])
  vbo_y = new gloo2.VertexBuffer(gl)
  prog.set_attribute('a_y', 'float', [vbo_y, 0, 0])
  return {'gl': gl, 'prog': prog, 'vbo_x', vbo_x, 'vbo_y': vbo_y}


module.exports =
  Model: Line
  View: LineView