gloo2 = require "gloo2"

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
# todo: update GLSL with latest version from glumpy
# todo: implement that colors set per-vertex work.
# todo: implement angles.


hex2rgb = (hex, alpha=1) ->
    # Convert hex color to RGBA tuple    
    colorparts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    color = [parseInt(colorparts[1], 16)/255, parseInt(colorparts[2], 16)/255, parseInt(colorparts[3], 16)/255]
    color.push(alpha)
    return color


line_width = (width) ->
    # Reduce line width for small values to make it more similar to canvas
    if width < 2
      width = width*width / 2
    return width


fill_array_with_float = (n, val) ->
    a = new Float32Array(n)
    a.fill(val)
    return a


fill_array_with_vec = (n, m, val) ->    
    a = new Float32Array(n*m)
    for i in [0..n]
      for j in [0..m]
        a[i*m+j] = val[j]
    return a


class BaseGLGlyph
  
  GLYPH: ''  # name of the glyph that this collection applies to
  
  VERT: ''
  FRAG: ''
  
  constructor: (gl, glyph) ->
    @gl = gl
    
    # Ensure there is a collections dict on the context
    @gl._collections ?= {}
    
    # If there is no collection for this glyph yet, create it
    if gl._collections[@GLYPH]?
      @coll = gl._collections[@GLYPH]
    else 
      @coll = gl._collections[@GLYPH] = {glglyphs:[]}
      @init_collection(@coll)

    # Register this item    
    @coll.glglyphs.push(this)
      
    # Init this item
    @glyph = glyph
    @nvertices = 0
    @size_changed = false
    @data_changed = false
    @uniforms_changed = false  # simulated uniforms, that is    

  set_data_changed: (n) ->
    if n != @nvertices
      @nvertices = n
      @size_changed = true    
    @data_changed = true

  set_uniforms_changed: () ->
      @uniforms_changed = true


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
    attribute float a_orientation;    
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
        v_rotation = vec2(cos(a_orientation), sin(a_orientation));
        // Calculate position
        vec2 pos = vec2(a_x, a_y) * u_scale + u_offset; // in pixels
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
        float crispness = 0.05;  // Nico defined this at 0.5, I want it crisper (lower)
        
        if( border_distance < 0.0)
            frag_color = fg_color;
        else if( signed_distance < 0.0 ) {
            frag_color = mix(bg_color, fg_color, pow(alpha, crispness));            
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
     
  init_collection: () ->
    # This gets called only once per context for each kind of glyph 
    gl = @gl
    frag = @FRAG.replace /MARKERCODE/, @MARKERCODE
    
    # The program
    @coll.prog = new gloo2.Program(gl)
    @coll.prog.set_shaders(@VERT, frag)
    @coll.vbo_x = new gloo2.VertexBuffer(gl)
    # Real attributes
    @coll.prog.set_attribute('a_x', 'float', [@coll.vbo_x, 0, 0])
    @coll.vbo_y = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_y', 'float', [@coll.vbo_y, 0, 0])
    @coll.vbo_s = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_size', 'float', [@coll.vbo_s, 0, 0])    
    # Fake uniforms
    @coll.vbo_linewidth = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_linewidth', 'float', [@coll.vbo_linewidth, 0, 0])
    @coll.vbo_fg_color = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_fg_color', 'vec4', [@coll.vbo_fg_color, 0, 0])
    @coll.vbo_bg_color = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_bg_color', 'vec4', [@coll.vbo_bg_color, 0, 0])

  draw: (indices, trans) ->
    # Assume same trans for all glyphs
    # todo: allow trans per glyph, but be smart if it *is* the same.
    @coll.trans = trans

  draw_collection: () ->
    trans = @coll.trans
    
    # Need resize?
    total_size = 0
    size_changed = false
    for glglyph in @coll.glglyphs
      size_changed ||= glglyph.size_changed
      total_size += glglyph.nvertices
    # Resize if we must
    if size_changed
      @_set_size(total_size)

    # Update parts that need updating
    offset = 0  # in number of vertices
    draw_offset = 0
    for glglyph in @coll.glglyphs
      if glglyph.nvertices && (size_changed || glglyph.data_changed)
        @_set_data(offset, glglyph)
      if glglyph.nvertices && (size_changed || glglyph.uniforms_changed)
        @_set_uniforms(offset, glglyph)
      offset += glglyph.nvertices
    
    # Reset and get full size
    for glglyph in @coll.glglyphs
      glglyph.size_changed = false
      glglyph.data_changed = false
      glglyph.uniforms_changed = false

    # Handle transformation to device coordinates
    dx = trans.dx; dy = trans.dy
    @coll.prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height])
    @coll.prog.set_uniform('u_offset', 'vec2', [dx[0], dy[0]])
    @coll.prog.set_uniform('u_scale', 'vec2', [dx[1]-dx[0], dy[1]-dy[0]])

    # todo: use indices
    @coll.prog.draw(@gl.POINTS, [draw_offset, total_size-draw_offset])

  _set_size: (n) ->
    n *= 4  # in bytes
    console.log('resizing')
    # todo: base class can do this if it had a list of vbo names    
    @coll.vbo_x.set_size(n)  
    @coll.vbo_y.set_size(n)
    @coll.vbo_s.set_size(n)
    #
    @coll.vbo_linewidth.set_size(n)
    @coll.vbo_fg_color.set_size(n * 4)
    @coll.vbo_bg_color.set_size(n * 4)
  
  _set_data: (offset, glglyph) ->
    console.log('setting data')    
    offset *= 4  # offset is in bytes
    @coll.vbo_x.set_data(offset, new Float32Array(glglyph.glyph.x))
    @coll.vbo_y.set_data(offset, new Float32Array(glglyph.glyph.y))
    @coll.vbo_s.set_data(offset, new Float32Array(glglyph.glyph.size))
  
  _set_uniforms: (offset, glglyph) ->
    console.log('setting uniforms')
    offset *= 4  # offset is in bytes. For vec4 we multiply with 4 again below
    glyph = glglyph.glyph
    nvertices = glglyph.nvertices
    # edgewidth
    a = fill_array_with_float(nvertices, glyph.visuals.line.width.value())
    @coll.vbo_linewidth.set_data(offset, a)
    # fg_color
    a = fill_array_with_vec(nvertices, 4, hex2rgb(glyph.visuals.line.color.value(), glyph.visuals.line.alpha.value()))
    @coll.vbo_fg_color.set_data(offset*4, a)
    # bg_color
    a = fill_array_with_vec(nvertices, 4, hex2rgb(glyph.visuals.fill.color.value(), glyph.visuals.fill.alpha.value()))
    @coll.vbo_bg_color.set_data(offset*4, a)
        
    # Static value for antialias. Smaller aa-region to obtain crisper images
    @coll.prog.set_uniform('u_antialias', 'float', [0.25])


class CircleGLGlyph extends MarkerGLGlyph
  
  GLYPH: 'circle'
  
  MARKERCODE: """    
    // --- disc
    float marker(vec2 P, float size)
    {
        return length(P) - size/2.0;
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
