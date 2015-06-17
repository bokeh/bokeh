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
    //
    uniform vec2 u_canvas_size;
    uniform vec2 u_offset;
    uniform vec2 u_scale;
    uniform float u_antialias;
    attribute float a_x;
    attribute float a_y;
    attribute vec4  a_fg_color;
    attribute vec4  a_bg_color;  
    attribute float a_edge_width;
    attribute float a_size;
    //
    varying float v_size;  
    varying vec4 v_fg_color;
    varying vec4 v_bg_color;
    varying float v_edge_width;
          
    void main (void) {
        v_size = a_size * 1.0;  // u_px_scale
        v_edge_width = a_edge_width;        
        v_fg_color  = a_fg_color;
        v_bg_color  = a_bg_color;
        vec2 pos = vec2(a_x, a_y) * u_scale + u_offset; // in pixels
        pos /= u_canvas_size;  // in 0..1
        gl_Position = vec4(pos*2.0-1.0, 0.0, 1.0);
        gl_Position.y *= -1.0;
        float edgewidth = max(v_edge_width, 1.0);
        gl_PointSize = v_size + 4.0*(edgewidth + 1.5*u_antialias);
    }
    """

  FRAG: """
    precision mediump float;
    varying float v_size;
    varying vec4 v_fg_color;
    varying vec4 v_bg_color;
    varying float v_edge_width;
    uniform float u_antialias;  
    
    MARKERCODE
    
    void main() {
        float edgewidth = max(v_edge_width, 1.0);
        float edgealphafactor = min(v_edge_width, 1.0);
    
        float size = v_size + 4.0*(edgewidth + 1.5*u_antialias);
        // factor 6 for acute edge angles that need room as for star marker

        // The marker function needs to be linked with this shader
        float r = marker(gl_PointCoord, size);
    
        // it takes into account an antialising layer
        // of size u_antialias inside the edge
        // r:
        // [-e/2-a, -e/2+a] antialising face-edge
        // [-e/2+a, e/2-a] core edge (center 0, diameter e-2a = 2t)
        // [e/2-a, e/2+a] antialising edge-background
        float t = 0.5*v_edge_width - u_antialias;
        float d = abs(r) - t;

        vec4 edgecolor = vec4(v_fg_color.rgb, edgealphafactor*v_fg_color.a);

        if (r > 0.5*v_edge_width + u_antialias) {
            // out of the marker (beyond the outer edge of the edge
            // including transition zone due to antialiasing)
            discard;
        }
        else if (d < 0.0) {
            // inside the width of the edge
            // (core, out of the transition zone for antialiasing)
            gl_FragColor = edgecolor;
        } else {
            if (v_edge_width == 0.) {// no edge
                if (r > -u_antialias) {
                    float alpha = 1.0 + r/u_antialias;
                    alpha = exp(-alpha*alpha);
                    gl_FragColor = vec4(v_bg_color.rgb, alpha*v_bg_color.a);
                } else {
                    gl_FragColor = v_bg_color;
                }
            } else {
                float alpha = d/u_antialias;
                alpha = exp(-alpha*alpha);
                if (r > 0.0) {
                    // outer part of the edge: fade out into the background...
                    gl_FragColor = vec4(edgecolor.rgb, alpha*edgecolor.a);
                } else {
                    gl_FragColor = mix(v_bg_color, edgecolor, alpha);
                }
            }
        }
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
    @coll.vbo_edge_width = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_edge_width', 'float', [@coll.vbo_edge_width, 0, 0])
    @coll.vbo_fg_color = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_fg_color', 'vec4', [@coll.vbo_fg_color, 0, 0])
    @coll.vbo_bg_color = new gloo2.VertexBuffer(gl)
    @coll.prog.set_attribute('a_bg_color', 'vec4', [@coll.vbo_bg_color, 0, 0])

  draw: (indices, trans) ->
        
    # Draw on the last glyph
    lastOne = @coll.glglyphs.slice(-1)[0]    
    if this is lastOne
      
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
      offset = 0
      for glglyph in @coll.glglyphs
        if size_changed || glglyph.data_changed
          @_set_data(offset, glglyph)
        if size_changed || glglyph.uniforms_changed
          @_set_uniforms(offset, glglyph)
        offset += glglyph.nvertices  # x 4?

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
      @coll.prog.draw(@gl.POINTS, [0, total_size])

  _set_size: (n) ->
    n *= 4  # in bytes
    console.log('resizing')
    # todo: base class can do this if it had a list of vbo names    
    @coll.vbo_x.set_size(n)  
    @coll.vbo_y.set_size(n)
    @coll.vbo_s.set_size(n)
    #
    @coll.vbo_edge_width.set_size(n)
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
    a = fill_array_with_float(nvertices, line_width(glyph.visuals.line.width.value()))
    @coll.vbo_edge_width.set_data(offset, a)
    # fg_color
    a = fill_array_with_vec(nvertices, 4, hex2rgb(glyph.visuals.fill.color.value()), glyph.visuals.fill.alpha.value())
    @coll.vbo_fg_color.set_data(offset*4, a)
    # bg_color
    a = fill_array_with_vec(nvertices, 4, hex2rgb(glyph.visuals.line.color.value()), glyph.visuals.line.alpha.value())
    @coll.vbo_bg_color.set_data(offset*4, a)
    window.tt = glyph
    
    # Static value for antialias
    @coll.prog.set_uniform('u_antialias', 'float', [1.0])



class CircleGLGlyph extends MarkerGLGlyph
  
  GLYPH: 'circle'
  
  MARKERCODE: """
    float marker(vec2 pointcoord, float size) {
      float r1 = length((pointcoord.xy - vec2(0.5,0.5))*size) - v_size/2.0;
      float r2 = length((pointcoord.xy - vec2(0.5,0.5))*size) - v_size/4.0;
      float r = max(r1,-r2);
      return r;
    }
    """


module.exports =
  CircleGLGlyph: CircleGLGlyph
