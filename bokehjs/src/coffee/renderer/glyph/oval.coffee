_ = require "underscore"
Glyph = require "./glyph"

class OvalView extends Glyph.View

  _set_data: () ->
    @_data_changed = true  
    @max_w2 = 0
    if @distances.width.units == "data"
      @max_w2 = @max_width/2
    @max_h2 = 0
    if @distances.height.units == "data"
      @max_h2 = @max_height/2

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @distances.width.units == "data"
      @sw = @sdist(@renderer.xmapper, @x, @width, 'center')
    else
      @sw = @width
    if @distances.height.units == "data"
      @sh = @sdist(@renderer.ymapper, @y, @height, 'center')
    else
      @sh = @height

  _render: (ctx, indices, {sx, sy, sw, sh}) ->
    if ctx.glx        
        return @_render_gl(ctx.glx, indices)
    
    for i in indices
      if isNaN(sx[i]+sy[i]+sw[i]+sh[i]+@angle[i])
        continue

      ctx.translate(sx[i], sy[i])
      ctx.rotate(@angle[i])

      ctx.beginPath()
      ctx.moveTo(0, -sh[i]/2)
      ctx.bezierCurveTo( sw[i]/2, -sh[i]/2,  sw[i]/2,  sh[i]/2, 0,  sh[i]/2)
      ctx.bezierCurveTo(-sw[i]/2,  sh[i]/2, -sw[i]/2, -sh[i]/2, 0, -sh[i]/2)
      ctx.closePath()

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.rotate(-@angle[i])
      ctx.translate(-sx[i], -sy[i])
    
  _render_gl: (glx, indices) ->
    that = this
    _render_gl_self = () ->
        that._render_gl(that.glx, null)
        window.requestAnimationFrame(_render_gl_self)    
    # Initialize
    if not @glx?
      window.tt = this
      @glid = @id      
      @glx = glx
      setup_gl(glx, @glid)      
      window.requestAnimationFrame(_render_gl_self)
    
    if @_data_changed && @x?      
      #@glx.command(['SIZE', @glid+'_x', @x.length]);
      #@glx.command(['SIZE', @glid+'_x', @y.length]);      
      @glx.command(['DATA', @glid+'_x', 0, new Float32Array(@x)]);
      @glx.command(['DATA', @glid+'_y', 0, new Float32Array(@y)]);
      @_data_length = @x.length
      @_data_changed = false
      #console.log('upload data ' + @x.length + '===================================')
    
    [dx, dy] = @renderer.map_to_screen([0, 1], [0, 1])    
    #@glx.command(['UNIFORM', @glid+'_prog', 'u_offset', [d0[0], d0[1]]])
    @glx.command(['UNIFORM', @glid+'_prog', 'u_canvas_size', 'vec2', @glx.size])
    @glx.command(['UNIFORM', @glid+'_prog', 'u_offset', 'vec2', [dx[0], dy[0]]])
    @glx.command(['UNIFORM', @glid+'_prog', 'u_scale', 'vec2', [dx[1]-dx[0], dy[1]-dy[0]]])
    @glx.command(['UNIFORM', @glid+'_prog', 'u_color', 'vec4', [0, 0, 1, 0.1]])
    @glx.command(['UNIFORM', @glid+'_prog', 'u_time', 'float', [performance.now()]])
        
    # todo: use indices
    if @_data_length?
        @glx.command(['DRAW', @glid+'_prog', 'POINTS', [0, @_data_length]])
        @glx.execute_pending_commands()

  draw_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0

    indices = [reference_point]
    sx = { }
    sx[reference_point] = (x0+x1)/2
    sy = { }
    sy[reference_point] = (y0+y1)/2

    scale = @sw[reference_point] / @sh[reference_point]
    d = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.8
    sw = { }
    sh = { }
    if scale > 1
      sw[reference_point] = d
      sh[reference_point] = d/scale
    else
      sw[reference_point] = d*scale
      sh[reference_point] = d

    @_render(ctx, indices, sx, sy, sw, sh)

  _bounds: (bds) ->
    return [
      [bds[0][0]-@max_w2, bds[0][1]+@max_w2],
      [bds[1][0]-@max_h2, bds[1][1]+@max_h2]
    ]

class Oval extends Glyph.Model
  default_view: OvalView
  type: 'Oval'
  distances: ['width', 'height']
  angles: ['angle']

  display_defaults: ->
    return _.extend {}, super(), {
      angle: 0.0
    }

setup_gl = (glx, glid) ->
  # This function sets up the visualization to render a line
  
  VERT = """
  precision mediump float;
  attribute float a_x;
  attribute float a_y;
  uniform vec2 u_canvas_size;
  uniform vec2 u_offset;
  uniform vec2 u_scale;
  uniform float u_time;
  void main() {
      float random1 = sin(a_x*1007.0); // on 0..1
      float random2 = sin(a_y*1007.0); // on 0..1
      vec2 pos1 = vec2(a_x, a_y);//
      //vec2 pos2 = vec2(random1*20.0 + pos1.x, pos1.y+50.0 + random2*20.0);
      vec2 pos2 = vec2(random1*0.1 + pos1.x, pos1.y+0.2 + random2*0.1);
      
      float pos_factor = mod(random1 + random2 + u_time / 5000.0, 1.0);
      vec2 pos = pos1 * pos_factor + pos2 * (1.0 - pos_factor);
      pos = pos * u_scale + u_offset; // in pixels

      pos /= u_canvas_size;  // in 0..1
      gl_Position = vec4(pos*2.0-1.0, 0.0, 1.0);
      gl_Position.y *= -1.0;
      gl_PointSize = 3.0;
  }"""
  FRAG = """
  precision mediump float;
  uniform vec4 u_color;
  void main() {
      float x = 2.0*gl_PointCoord.x - 1.0;
      float y = 2.0*gl_PointCoord.y - 1.0;
      gl_FragColor = vec4(0.0, 0.0, 1.0, 0.4);
      gl_FragColor.a *= 1.0 - (x*x + y*y);
  }"""
  
  # TODO: the ids need to be unique!
  glx.command ['CREATE', glid+'_prog', 'Program']
  glx.command ['SHADERS', glid+'_prog', VERT, FRAG]
  glx.command(['CREATE', glid+'_x', 'VertexBuffer'])
  glx.command(['CREATE', glid+'_y', 'VertexBuffer'])
  glx.command(['ATTRIBUTE', glid+'_prog', 'a_x', 'float', [glid+'_x', 0, 0]])
  glx.command(['ATTRIBUTE', glid+'_prog', 'a_y', 'float', [glid+'_y', 0, 0]])

module.exports =
  Model: Oval
  View: OvalView