gloo2 = require "gloo2"
color = require "../../common/color"
color2rgba = color.color2rgba

# Copyright notice: many of the awesome GLSL code contained in this module is based
# on code developed by Nicolas Rougier as part of the Glumpy and Vispy projects.
# The algorithms are published in http://jcgt.org/published/0003/04/01/

# This module contains all gl-specific code to add gl support for the glyphs.
# By implementing it separetely, the GL functionality can be spun off in a
# separate library.
# Other locations where we work with GL, or prepare for GL-renderinh:
# - canvas.coffee (maybe refactor so this one is gl-unaware?)
# - plot.coffee
# - glyph.coffee, other glyphs?

# todo: Can we implement all gl-specifics that's still needed in glyph.coffee?
# todo: implement that colors set per-vertex work.
# todo: implement angles.


line_width = (width) ->
    # Increase small values to make it more similar to canvas
    if width < 2
      width = Math.sqrt(width*2)
    return width

fill_array_with_float = (n, val) ->
    a = new Float32Array(n)
    for i in [0...n]
        a[i] = val
    return a

fill_array_with_vec = (n, m, val) ->    
    a = new Float32Array(n*m)
    for i in [0...n]
      for j in [0...m]
        a[i*m+j] = val[j]
    return a

attach_float = (prog, vbo, att_name, n, visual, name) ->
    # Attach a float attribute to the program. Use singleton value if we can,
    # otherwise use VBO to apply array.
    if visual[name].fixed_value?
      prog.set_attribute(att_name, 'float', null, visual[name].fixed_value)
    else
      a = new Float32Array(visual.cache[name + '_array'])
      vbo.set_size(n*4)
      vbo.set_data(0, a)
      prog.set_attribute(att_name, 'float', [vbo, 0, 0])
    return a

attach_color = (prog, vbo, att_name, n, visual) ->
    # Attach the color attribute to the program. If there's just one color,
    # then use this single color for all vertices (no VBO). Otherwise we
    # create an array and upload that to the VBO, which we attahce to the prog.
    m = 4    
    if visual.color.fixed_value? and visual.alpha.fixed_value?
      rgba = color2rgba(visual.color.fixed_value, visual.alpha.fixed_value)
      prog.set_attribute(att_name, 'vec4', null, rgba)

    else      
      # Get array of colors
      if visual.color.fixed_value?
        colors = (visual.color.fixed_value for i in [0...n])
      else
        colors = visual.cache.color_array
      # Get array of alphas
      if visual.alpha.fixed_value?
        alphas = fill_array_with_float(n, visual.alpha.fixed_value)
      else
        alphas = visual.cache.alpha_array
      # Get array of rgbs
      a = new Float32Array(n*m)
      for i in [0...n]
        rgba = color2rgba(colors[i], alphas[i])
        for j in [0...m]
          a[i*m+j] = rgba[j]
      # Attach vbo      
      vbo.set_size(n*m*4)
      vbo.set_data(0, a)
      prog.set_attribute(att_name, 'vec4', [vbo, 0, 0])
    return a
 

class BaseGLGlyph
  
  GLYPH: ''  # name of the glyph that this collection applies to
  
  VERT: ''
  FRAG: ''
  
  constructor: (gl, glyph) ->
    @gl = gl
    
    @glyph = glyph
    @nvertices = 0
    @size_changed = false
    @data_changed = false
    @visuals_changed = false
    
    @init()

  set_data_changed: (n) ->
    if n != @nvertices
      @nvertices = n
      @size_changed = true    
    @data_changed = true

  set_visuals_changed: () ->
      @visuals_changed = true


class LineGLGlyph extends BaseGLGlyph
    
    GLYPH: 'line'
    VERT: 'xxx'
    FRAG: 'xxx'

class MarkerGLGlyph extends BaseGLGlyph
  # Base class for markers. All markers share the same GLSL, except for one
  # function that defines the marker geometry.
  
  VERT: """
    precision mediump float;
    const float SQRT_2 = 1.4142135623730951;
    //
    uniform vec2 u_canvas_size;
    uniform vec2 u_offset;
    uniform vec2 u_scale;
    uniform float u_antialias;
    //
    attribute float a_x;
    attribute float a_y;
    attribute float a_size;
    attribute float a_angle;  // in radians
    attribute float a_linewidth;
    attribute vec4  a_fg_color;
    attribute vec4  a_bg_color;
    //
    varying float v_linewidth;
    varying float v_size;
    varying vec4  v_fg_color;
    varying vec4  v_bg_color;
    varying vec2  v_rotation;
    
    void main (void)
    {
        v_size = a_size;
        v_linewidth = a_linewidth;
        v_fg_color = a_fg_color;
        v_bg_color = a_bg_color;
        v_rotation = vec2(cos(-a_angle), sin(-a_angle));
        // Calculate position - the -0.5 is to correct for canvas origin
        vec2 pos = vec2(a_x, a_y) * u_scale + u_offset - vec2(0.5, 0.5); // in pixels
        pos /= u_canvas_size;  // in 0..1
        gl_Position = vec4(pos*2.0-1.0, 0.0, 1.0);
        gl_Position.y *= -1.0;        
        gl_PointSize = SQRT_2 * v_size + 2.0 * (a_linewidth + 1.5*u_antialias);
    }
    """

  FRAG: """
    precision mediump float;
    const float SQRT_2 = 1.4142135623730951;
    const float PI = 3.14159265358979323846264;
    //
    uniform float u_antialias;
    //
    varying vec4  v_fg_color;
    varying vec4  v_bg_color;
    varying float v_linewidth;
    varying float v_size;
    varying vec2  v_rotation;
    
    MARKERCODE
    
    vec4 outline(float distance, float linewidth, float antialias, vec4 fg_color, vec4 bg_color)
    {
        vec4 frag_color;
        float t = linewidth/2.0 - antialias;
        float signed_distance = distance;
        float border_distance = abs(signed_distance) - t;
        float alpha = border_distance/antialias;
        alpha = exp(-alpha*alpha);

        if( border_distance < 0.0)
            frag_color = fg_color;
        else if( signed_distance < 0.0 ) {
            frag_color = mix(bg_color, fg_color, sqrt(alpha));
        } else {
            if( abs(signed_distance) < (linewidth/2.0 + antialias) ) {
                frag_color = vec4(fg_color.rgb, fg_color.a * alpha);
            } else {
                discard;
            }
        }
        return frag_color;
    }

    void main()
    {
        vec2 P = gl_PointCoord.xy - vec2(0.5, 0.5);
        P = vec2(v_rotation.x*P.x - v_rotation.y*P.y,
                 v_rotation.y*P.x + v_rotation.x*P.y);
        float point_size = SQRT_2*v_size  + 2.0 * (v_linewidth + 1.5*u_antialias);
        float distance = marker(P*point_size, v_size);
        gl_FragColor = outline(distance, v_linewidth, u_antialias, v_fg_color, v_bg_color);
        //gl_FragColor.a *= 3.0;
        //gl_FragColor.rb = gl_FragColor.br;
    }
    """
    
  MARKERCODE: "<defined in subclasses>" 
     
  init: () ->
     
    gl = @gl
    frag = @FRAG.replace /MARKERCODE/, @MARKERCODE
    
    @last_trans = {}  # Keep track of transform
    
    # The program
    @prog = new gloo2.Program(gl)
    @prog.set_shaders(@VERT, frag)
    @vbo_x = new gloo2.VertexBuffer(gl)
    # Real attributes
    @prog.set_attribute('a_x', 'float', [@vbo_x, 0, 0])
    @vbo_y = new gloo2.VertexBuffer(gl)
    @prog.set_attribute('a_y', 'float', [@vbo_y, 0, 0])
    @vbo_s = new gloo2.VertexBuffer(gl)
    @prog.set_attribute('a_size', 'float', [@vbo_s, 0, 0])
    @vbo_a = new gloo2.VertexBuffer(gl)
    @prog.set_attribute('a_angle', 'float', [@vbo_a, 0, 0])
    # VBO's for attributes (they may not be used if value is singleton)
    @vbo_linewidth = new gloo2.VertexBuffer(gl)
    @vbo_fg_color = new gloo2.VertexBuffer(gl)
    @vbo_bg_color = new gloo2.VertexBuffer(gl)
    @index_buffer = new gloo2.IndexBuffer(gl)
 
  draw: (indices, mainGlyph, trans) ->
    
    # The main glyph has the data, *this* glyph has the visuals.
    nvertices = mainGlyph.glglyph.nvertices
    
    # Upload data if we must. Only happens for main glyph.
    if @data_changed
      @_set_data(nvertices)
      @data_changed = false
    else if @glyph.radius? and (trans.sx != @last_trans.sx or trans.sy != @last_trans.sy)
      # Keep screen radius up-to-date for circle glyph. Only happens when a radius is given
      @last_trans = trans
      @vbo_s.set_data(0, new Float32Array((s*2 for s in @glyph.sradius)))

    # Update visuals if we must. Can happen for all glyphs.
    if @visuals_changed
      @_set_visuals(nvertices)
      @visuals_changed = false
    
    # Bit of a secret feature to allow easy comparison during dev
    offset = (window.BOKEH_WEBGL == 'both') * 10
       
    # Handle transformation to device coordinates
    @prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height])
    @prog.set_uniform('u_offset', 'vec2', [trans.dx[0] + offset, trans.dy[0]])
    @prog.set_uniform('u_scale', 'vec2', [trans.sx, trans.sy])
    
    # Select buffers from main glyph 
    # (which may be this glyph but maybe not if this is a (non)selection glyph)
    @prog.set_attribute('a_x', 'float', [mainGlyph.glglyph.vbo_x, 0, 0])
    @prog.set_attribute('a_y', 'float', [mainGlyph.glglyph.vbo_y, 0, 0])
    @prog.set_attribute('a_size', 'float', [mainGlyph.glglyph.vbo_s, 0, 0])
    
    # Draw directly or using indices. Do not handle indices if they do not 
    # fit in a uint16; WebGL 1.0 does not support uint32.
    if nvertices > 65535
      @prog.draw(@gl.POINTS, [0, nvertices])
      console.log('BOKEHGL ERROR: cannot handle selections for datasets of over 65535 elements.')
    else if indices.length == nvertices
      @prog.draw(@gl.POINTS, [0, nvertices])
    else
      @index_buffer.set_size(indices.length*2)
      @index_buffer.set_data(0, new Uint16Array(indices))
      @prog.draw(@gl.POINTS, @index_buffer)

  _set_data: (nvertices) ->    
    n = nvertices * 4  # in bytes
    # Set buffer size
    @vbo_x.set_size(n)
    @vbo_y.set_size(n)
    @vbo_a.set_size(n)
    @vbo_s.set_size(n)
    # Upload data for x and y
    @vbo_x.set_data(0, new Float32Array(@glyph.x))
    @vbo_y.set_data(0, new Float32Array(@glyph.y))
    # Angle if available; circle does not have angle. If we don't set data, angle is default 0 in glsl
    if @glyph.angle?  
      @vbo_a.set_data(0, new Float32Array(@glyph.angle))
    # Radius is special; some markes allow radius in data-coords instead of screen coords
    # @radius tells us that radius is in units, sradius is the pre-calculated screen radius 
    if @glyph.radius?
      @vbo_s.set_data(0, new Float32Array((s*2 for s in @glyph.sradius)))
    else
      @vbo_s.set_data(0, new Float32Array(@glyph.size))

  _set_visuals: (nvertices) ->    
    attach_float(@prog, @vbo_linewidth, 'a_linewidth', nvertices, @glyph.visuals.line, 'width')
    attach_color(@prog, @vbo_fg_color, 'a_fg_color', nvertices, @glyph.visuals.line)
    attach_color(@prog, @vbo_bg_color, 'a_bg_color', nvertices, @glyph.visuals.fill)
    # Static value for antialias. Smaller aa-region to obtain crisper images
    @prog.set_uniform('u_antialias', 'float', [0.9])


class CircleGLGlyph extends MarkerGLGlyph
  
  GLYPH: 'circle'
  
  MARKERCODE: """
    // --- disc
    float marker(vec2 P, float size)
    {
        return length(P) - size/2.0;
    }
    """

class SquareGLGlyph extends MarkerGLGlyph
  
  GLYPH: 'square'
  
  MARKERCODE: """
    // --- square
    float marker(vec2 P, float size)
    {
        return max(abs(P.x), abs(P.y)) - size/2.0;
    }
    """

class CloverGlyph extends MarkerGLGlyph
  
  GLYPH: 'clover'
  
  MARKERCODE: """    
    float marker(vec2 P, float size)
    {
        // clover (3 discs)
        float t1 = -PI/2.0;
        vec2  c1 = 0.225*vec2(cos(t1),sin(t1));
        float t2 = t1+2.0*PI/3.0;
        vec2  c2 = 0.225*vec2(cos(t2),sin(t2));
        float t3 = t2+2.0*PI/3.0;
        vec2  c3 = 0.225*vec2(cos(t3),sin(t3));
        float r1 = length( P - c1*size) - size/4.25;
        float r2 = length( P - c2*size) - size/4.25;
        float r3 = length( P - c3*size) - size/4.25;
        float r4 =  min(min(r1,r2),r3);
    
        // Root (2 circles and 2 planes)
        vec2 c4 = vec2(+0.65, 0.125);
        vec2 c5 = vec2(-0.65, 0.125);
        float r5 = length(P-c4*size) - size/1.6;
        float r6 = length(P-c5*size) - size/1.6;
        float r7 = P.y - 0.5*size;
        float r8 = 0.2*size - P.y;
        float r9 = max(-min(r5,r6), max(r7,r8));
    
        return min(r4,r9);
    }
    """
  

module.exports =
  CircleGLGlyph: CircleGLGlyph
  SquareGLGlyph: SquareGLGlyph
