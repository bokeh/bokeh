_ = require "underscore"
Glyph = require "./glyph"
hittest = require "../../common/hittest"

class LineView extends Glyph.View
    
  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    console.log('mapping data')    
  
  _set_data: () ->
    console.log('setting data') 
    self._data_changed = true
    
  _render: (ctx, indices, {sx, sy}) ->

    drawing = false
    @visuals.line.set_value(ctx)  # what does this do?
    
    if ctx.glx
        #return @_render_gl(ctx.glx, indices)
        @_render_gl(ctx.glx, indices)
    
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

  _render_gl: (glx, indices) ->
     # Initialize
     if not @glx?
       @glx = glx
       setup_gl(glx)
    
     if self._data_changed
       #@glx.command(['SIZE', 'line1_x', @x.length]);
       #@glx.command(['SIZE', 'line1_x', @y.length]);
       @glx.command(['DATA', 'line1_x', 0, new Float32Array(@x)]);
       @glx.command(['DATA', 'line1_y', 0, new Float32Array(@y)]);
    
     [dx, dy] = @renderer.map_to_screen([0, 1], [0, 1])
     console.log('d0: ' + dx.toSource() + '  d1:' + dy.toSource())     
     #@glx.command(['UNIFORM', 'line1_prog', 'u_offset', [d0[0], d0[1]]])
     @glx.command(['UNIFORM', 'line1_prog', 'u_canvas_size', 'vec2', @glx.size])
     @glx.command(['UNIFORM', 'line1_prog', 'u_offset', 'vec2', [dx[0], dy[0]]])
     @glx.command(['UNIFORM', 'line1_prog', 'u_scale', 'vec2', [dx[1]-dx[0], dy[1]-dy[0]]])
      
     # todo: use indices
     @glx.command(['DRAW', 'line1_prog', 'LINES', [0, @x.length]])

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Line extends Glyph.Model
  default_view: LineView
  type: 'Line'
  visuals: ['line']


setup_gl = (glx) ->
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
      gl_Position.y *= -1;
  }"""
  FRAG = """
  precision mediump float;
  uniform vec4 u_color;
  void main() {      
      gl_FragColor = u_color;
      gl_FragColor.a = 1.0;
  }"""
  
  # TODO: the ids need to be unique!
  glx.command ['CREATE', 'line1_prog', 'Program']
  glx.command ['SHADERS', 'line1_prog', VERT, FRAG]
  glx.command(['CREATE', 'line1_x', 'VertexBuffer'])
  glx.command(['CREATE', 'line1_y', 'VertexBuffer'])
  glx.command(['ATTRIBUTE', 'line1_prog', 'a_x', 'float', ['line1_x', 0, 0]])
  glx.command(['ATTRIBUTE', 'line1_prog', 'a_y', 'float', ['line1_y', 0, 0]])
  

module.exports =
  Model: Line
  View: LineView