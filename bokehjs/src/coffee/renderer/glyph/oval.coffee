_ = require "underscore"
gloo2 = require "gloo2"
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
    if ctx.gl        
        return @_render_gl(ctx, indices)
    
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
    
  _render_gl: (ctx, indices) ->
    that = this
    gl = ctx.gl
    _render_gl_self = () ->             
        #ctx.gl.clearColor(0, 0, 0, 0)
        #ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT || ctx.gl.DEPTH_BUFFER_BIT)
        ctx.gl.blendFunc(ctx.gl.SRC_ALPHA, ctx.gl.ZERO)
        that._render_gl(ctx, undefined)
        #
        ctx.clearRect(0, 0, ctx.canvas2d.width, ctx.canvas2d.height)
        ctx.drawImage(that.hack_canvas, 0, 0)        
        ctx.drawImage(ctx.canvas3d, 0, 0)
        window.requestAnimationFrame(_render_gl_self)
    
    if not @hack_canvas?
        @hack_canvas = document.createElement('canvas')
        @hack_ctx = @hack_canvas.getContext('2d')
        @hack_canvas.width = ctx.canvas2d.width
        @hack_canvas.height = ctx.canvas2d.height    
    if indices?
        that.hack_ctx.clearRect(0, 0, ctx.canvas2d.width, ctx.canvas2d.height)        
        that.hack_ctx.drawImage(ctx.canvas2d, 0, 0)  # take snapshot without the gl        
    
    #ctx.plot.request_render()
    # Initialize
    if not @_gl?
      window.tt = this
      @_gl = setup_gl(gl)
      window.requestAnimationFrame(_render_gl_self)
        
    if @_data_changed && @x?      
      @_gl.vbo_x.set_size(@x.length * 4)  # size in bytes
      @_gl.vbo_x.set_data(0, new Float32Array(@x))        
      @_gl.vbo_y.set_size(@y.length * 4)
      @_gl.vbo_y.set_data(0, new Float32Array(@y))      
      #@_gl.vbo_c.set_size(@size.length * 4)
      #@_gl.vbo_c.set_data(0, new Float32Array(@size))      
      @_data_changed = false
      #console.log('upload data ' + @x.length + '===================================')
    
    [dx, dy] = @renderer.map_to_screen([0, 1], [0, 1])    
    @_gl.prog.set_uniform('u_canvas_size', 'vec2', ctx.size)
    @_gl.prog.set_uniform('u_offset', 'vec2', [dx[0], dy[0]])
    @_gl.prog.set_uniform('u_scale', 'vec2', [dx[1]-dx[0], dy[1]-dy[0]])
    @_gl.prog.set_uniform('u_color', 'vec4', [0, 1, 0, 0.5])
    @_gl.prog.set_uniform('u_time', 'float', [performance.now()])
            
    # todo: use indices
    if @x
        @_gl.prog.draw(gl.POINTS, [0, @x.length])

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

setup_gl = (gl) ->
  # This function sets up the visualization to render a line
  
  VERT = """
  precision mediump float;
  attribute float a_x;
  attribute float a_y;
  attribute float a_color;
  uniform vec2 u_canvas_size;
  uniform vec2 u_offset;
  uniform vec2 u_scale;
  uniform float u_time;
  varying vec4 v_color;
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
        
      // determind color
      v_color = vec4(floor(random1+0.5), 1.0, floor(random2+0.5), 1.0);
  }"""
  FRAG = """
  precision mediump float;
  uniform vec4 u_color;
  varying vec4 v_color;
  void main() {
      float x = 2.0*gl_PointCoord.x - 1.0;
      float y = 2.0*gl_PointCoord.y - 1.0;
      gl_FragColor = v_color;
      gl_FragColor.a *= 0.6;
      //gl_FragColor.r *= v_color;
      gl_FragColor.a *= 1.0 - (x*x + y*y);
  }"""
  
  prog = new gloo2.Program(gl)
  prog.set_shaders(VERT, FRAG)
  vbo_x = new gloo2.VertexBuffer(gl)
  prog.set_attribute('a_x', 'float', [vbo_x, 0, 0])
  vbo_y = new gloo2.VertexBuffer(gl)
  prog.set_attribute('a_y', 'float', [vbo_y, 0, 0])
  vbo_c = new gloo2.VertexBuffer(gl)
  #prog.set_attribute('a_color', 'float', [vbo_c, 0, 0])
  return {'gl': gl, 'prog': prog, 'vbo_x', vbo_x, 'vbo_y': vbo_y, 'vbo_c': vbo_c}

module.exports =
  Model: Oval
  View: OvalView
