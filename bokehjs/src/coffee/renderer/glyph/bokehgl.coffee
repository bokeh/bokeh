gloo2 = require "gloo2"
color = require "../../common/color"
color2rgba = color.color2rgba

# Copyright notice: many of the awesome techniques and  GLSL code contained in
# this module are based on work by Nicolas Rougier as part of the Glumpy and 
# Vispy projects. The algorithms are published in
# http://jcgt.org/published/0003/04/01/ and http://jcgt.org/published/0002/02/08/
# 
# This module contains all gl-specific code to add gl support for the glyphs.
# By implementing it separetely, the GL functionality can be spun off in a
# separate library.
# Other locations where we work with GL, or prepare for GL-rendering:
# - plot.coffee
# - glyph.coffee
# - glyph_renderer.coffee
# - a few lines in each glyph-module that supports WebGL


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
    vbo.used = true
    if visual[name].fixed_value?
      prog.set_attribute(att_name, 'float', null, visual[name].fixed_value)
      vbo.used = false
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
    vbo.used = true
    if visual.color.fixed_value? and visual.alpha.fixed_value?
      rgba = color2rgba(visual.color.fixed_value, visual.alpha.fixed_value)
      prog.set_attribute(att_name, 'vec4', null, rgba)
      vbo.used = false

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
  
  GLYPH: ''  # name of the glyph that this gl-glyph applies to
  
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
    
    JOIN:
      'miter': 0, 'round': 1, 'bevel': 2

    CAPS:
      '': 0, 'none': 0, '.': 0,
      'round': 1, ')': 1, '(': 1, 'o': 1,
      'triangle in': 2, '<': 2, 'triangle out': 3, '>': 3,
      'square': 4, '[': 4, ']': 4, '=': 4,
      'butt': 5, '|': 5
       
    VERT: """
      precision mediump float;
      
      const float PI = 3.14159265358979323846264;
      const float THETA = 15.0 * 3.14159265358979323846264/180.0;
      
      uniform vec2 u_canvas_size, u_offset, u_scale;
            
      uniform vec4 u_color;
      uniform float u_linewidth;
      uniform float u_antialias;
      uniform vec2 u_linecaps;
      uniform float u_linejoin;
      uniform float u_miter_limit;
      uniform float u_length;
      uniform float u_dash_phase;
      uniform float u_dash_period;
      uniform float u_dash_index;
      uniform vec2 u_dash_caps;
      uniform float u_closed;
      // TODO: some uniforms can be set directly in fragment shader, rather than passing as a varying
      
      attribute vec2 a_position;
      attribute vec4 a_tangents;
      attribute vec2 a_segment;
      attribute vec2 a_angles;
      attribute vec2 a_texcoord;
      
      varying vec4  v_color;
      varying vec2  v_segment;
      varying vec2  v_angles;
      varying vec2  v_linecaps;
      varying vec2  v_texcoord;
      varying vec2  v_miter;
      varying float v_miter_limit;
      varying float v_length;
      varying float v_linejoin;
      varying float v_linewidth;
      varying float v_antialias;
      varying float v_dash_phase;
      varying float v_dash_period;
      varying float v_dash_index;
      varying vec2  v_dash_caps;
      varying float v_closed;
      
      float cross(in vec2 v1, in vec2 v2)
      {
          return v1.x*v2.y - v1.y*v2.x;
      }
      
      float signed_distance(in vec2 v1, in vec2 v2, in vec2 v3)
      {
          return cross(v2-v1,v1-v3) / length(v2-v1);
      }
      
      void rotate( in vec2 v, in float alpha, out vec2 result )
      {
          float c = cos(alpha);
          float s = sin(alpha);
          result = vec2( c*v.x - s*v.y,
                         s*v.x + c*v.y );
      }
      
      void main()
      {          
          v_color = u_color;
          v_linewidth = u_linewidth;
          v_antialias = u_antialias;
          v_linecaps = u_linecaps;
          v_linejoin    = u_linejoin;
          v_miter_limit = u_miter_limit;
          v_length      = u_length;
          v_dash_phase  = u_dash_phase;
          v_dash_period = u_dash_period;
          v_dash_index  = u_dash_index;
          v_dash_caps   = u_dash_caps;
          v_closed = u_closed;
          bool closed = (v_closed > 0.0);
          
          // Scale to map to pixel coordinates. The original algorithm from the paper
          // assumed anisotropic scale. We obviously do not have this.
          vec2 scale = abs(u_scale);
          
          // Attributes to varyings
          v_angles  = a_angles;
          v_segment = a_segment * scale;
          v_length  = v_length * length(scale); // TODO: store length as vec2 and scale it anisotropically!
          
          // Thickness below 1 pixel are represented using a 1 pixel thickness
          // and a modified alpha
          v_color.a = min(v_linewidth, v_color.a);
          v_linewidth = max(v_linewidth, 1.0);
          
          // If color is fully transparent we just will discard the fragment anyway
          if( v_color.a <= 0.0 )
          {
              gl_Position = vec4(0.0,0.0,0.0,1.0);
              return;
          }
      
          // This is the actual half width of the line
          float w = ceil(1.25*v_antialias+v_linewidth)/2.0;
          
          vec2 position = a_position * scale;
          
          vec2 t1 = normalize(a_tangents.xy * scale);  // note the scaling for aspect ratio here
          vec2 t2 = normalize(a_tangents.zw * scale);
          float u = a_texcoord.x;
          float v = a_texcoord.y;
          vec2 o1 = vec2( +t1.y, -t1.x);
          vec2 o2 = vec2( +t2.y, -t2.x);
      
      
          // This is a join
          // ----------------------------------------------------------------
          if( t1 != t2 ) {
              float angle  = atan (t1.x*t2.y-t1.y*t2.x, t1.x*t2.x+t1.y*t2.y);  // TODO: do we even need the angles then?
              vec2 t  = normalize(t1+t2);
              vec2 o  = vec2( + t.y, - t.x);
      
              if ( v_dash_index > 0.0 )
              {
                  // Broken angle
                  // ----------------------------------------------------------------
                  if( (abs(angle) > THETA) ) {
                      position += v * w * o / cos(angle/2.0);
                      float s = sign(angle);
                      if( angle < 0.0 ) {
                          if( u == +1.0 ) {
                              u = v_segment.y + v * w * tan(angle/2.0);
                              if( v == 1.0 ) {
                                  position -= 2.0 * w * t1 / sin(angle);
                                  u -= 2.0 * w / sin(angle);
                              }
                          } else {
                              u = v_segment.x - v * w * tan(angle/2.0);
                              if( v == 1.0 ) {
                                  position += 2.0 * w * t2 / sin(angle);
                                  u += 2.0*w / sin(angle);
                              }
                          }
                      } else {
                          if( u == +1.0 ) {
                              u = v_segment.y + v * w * tan(angle/2.0);
                              if( v == -1.0 ) {
                                  position += 2.0 * w * t1 / sin(angle);
                                  u += 2.0 * w / sin(angle);
                              }
                          } else {
                              u = v_segment.x - v * w * tan(angle/2.0);
                              if( v == -1.0 ) {
                                  position -= 2.0 * w * t2 / sin(angle);
                                  u -= 2.0*w / sin(angle);
                              }
                          }
                      }
                      // Continuous angle
                      // ------------------------------------------------------------
                  } else {
                      position += v * w * o / cos(angle/2.0);
                      if( u == +1.0 ) u = v_segment.y;
                      else            u = v_segment.x;
                  }
              }
      
              // Solid line
              // --------------------------------------------------------------------
              else
              {
                  position.xy += v * w * o / cos(angle/2.0);
                  if( angle < 0.0 ) {
                      if( u == +1.0 ) {
                          u = v_segment.y + v * w * tan(angle/2.0);
                      } else {
                          u = v_segment.x - v * w * tan(angle/2.0);
                      }
                  } else {
                      if( u == +1.0 ) {
                          u = v_segment.y + v * w * tan(angle/2.0);
                      } else {
                          u = v_segment.x - v * w * tan(angle/2.0);
                      }
                  }
              }
      
          // This is a line start or end (t1 == t2)
          // ------------------------------------------------------------------------
          } else {
              position += v * w * o1;
              if( u == -1.0 ) {
                  u = v_segment.x - w;
                  position -= w * t1;
              } else {
                  u = v_segment.y + w;
                  position += w * t2;
              }
          }
      
          // Miter distance
          // ------------------------------------------------------------------------
          vec2 t;
          vec2 curr = a_position*scale;
          if( a_texcoord.x < 0.0 ) {
              vec2 next = curr + t2*(v_segment.y-v_segment.x);
      
              rotate( t1, +a_angles.x/2.0, t);
              v_miter.x = signed_distance(curr, curr+t, position);
      
              rotate( t2, +a_angles.y/2.0, t);
              v_miter.y = signed_distance(next, next+t, position);
          } else {
              vec2 prev = curr - t1*(v_segment.y-v_segment.x);
      
              rotate( t1, -a_angles.x/2.0,t);
              v_miter.x = signed_distance(prev, prev+t, position);
      
              rotate( t2, -a_angles.y/2.0,t);
              v_miter.y = signed_distance(curr, curr+t, position);
          }
      
          if (!closed && v_segment.x <= 0.0) {
              v_miter.x = 1e10;
          }
          if (!closed && v_segment.y >= v_length)
          {
              v_miter.y = 1e10;
          }
      
          v_texcoord = vec2( u, v*w );
          
          // Calculate position in device coordinates. Note that we 
          // already scaled with abs(u_scale) above.
          vec2 normpos = position * sign(u_scale) + (u_offset - vec2(0.5, 0.5));
          normpos /= u_canvas_size;  // in 0..1     
          gl_Position = vec4(normpos*2.0-1.0, 0.0, 1.0);
          gl_Position.y *= -1.0;
      }

    """
    
    VERT_: """
      precision mediump float;
      
      attribute vec2 a_position;
            
      uniform vec2 u_canvas_size;
      uniform vec2 u_offset;
      uniform vec2 u_scale;
      
      void main () {
        
        // Calculate position - the -0.5 is to correct for canvas origin
        vec2 posn = a_position * u_scale + u_offset - vec2(0.5, 0.5); // in pixels
        posn /= u_canvas_size;  // in 0..1
        gl_Position = vec4(posn*2.0-1.0, 0.0, 1.0);
        gl_Position.y *= -1.0;
      }
    """
    
    
    FRAG: """
      precision mediump float;
      
      void main () {
        gl_FragColor = vec4(0.0, 0.5, 0.0, 1.0);
      }
    
    """
    
    init: () ->
      gl = @gl
      
      # The program
      @prog = new gloo2.Program(gl)
      @prog.set_shaders(@VERT, @FRAG)
      @index_buffer = new gloo2.IndexBuffer(gl)
      # Buffers
      @vbo_position = new gloo2.VertexBuffer(gl)
      @vbo_tangents = new gloo2.VertexBuffer(gl)
      @vbo_segment = new gloo2.VertexBuffer(gl)
      @vbo_angles = new gloo2.VertexBuffer(gl)
      @vbo_texcoord = new gloo2.VertexBuffer(gl)
 
    draw: (indices, mainGlyph, trans) ->
      
      if @data_changed
        @_set_data()
        @data_changed = false
      if @visuals_changed
        @_set_visuals()
        @visuals_changed = false
            
      # Select buffers from main glyph 
      # (which may be this glyph but maybe not if this is a (non)selection glyph)
      @prog.set_attribute('a_position', 'vec2', [mainGlyph.glglyph.vbo_position, 0, 0])
      @prog.set_attribute('a_tangents', 'vec4', [mainGlyph.glglyph.vbo_tangents, 0, 0])
      @prog.set_attribute('a_segment', 'vec2', [mainGlyph.glglyph.vbo_segment, 0, 0])
      @prog.set_attribute('a_angles', 'vec2', [mainGlyph.glglyph.vbo_angles, 0, 0])
      @prog.set_attribute('a_texcoord', 'vec2', [mainGlyph.glglyph.vbo_texcoord, 0, 0])
      #
      @prog.set_uniform('u_length', 'float', [mainGlyph.glglyph.cumsum])
      
      # Handle transformation to device coordinates
      @prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height])
      @prog.set_uniform('u_offset', 'vec2', [trans.dx[0], trans.dy[0]])
      @prog.set_uniform('u_scale', 'vec2', [trans.sx, trans.sy])
      
      #@prog.draw(@gl.TRIANGLES, [0, nvertices])
      @index_buffer.set_size(@I_triangles.length*2)
      @index_buffer.set_data(0, new Uint16Array(@I_triangles))
      @prog.draw(@gl.LINE_STRIP, @index_buffer)
      window.Y = @I_triangles
    
    _set_data: () ->
      @_bake()
      
      @vbo_position.set_size(@V_position.length*4);
      @vbo_position.set_data(0, @V_position)
      
      @vbo_tangents.set_size(@V_tangents.length*4)
      @vbo_tangents.set_data(0, @V_tangents)
      
      @vbo_segment.set_size(@V_segment.length*4)
      @vbo_segment.set_data(0, @V_segment)
      
      @vbo_angles.set_size(@V_angles.length*4)
      @vbo_angles.set_data(0, @V_angles)
      
      @vbo_texcoord.set_size(@V_texcoord.length*4)
      @vbo_texcoord.set_data(0, @V_texcoord)
    
    _set_visuals: () ->
      window.X = this
      
      color = color2rgba(@glyph.visuals.line.color.value(), @glyph.visuals.line.alpha.value())
      cap = @CAPS[@glyph.visuals.line.cap.value()]
      
      @prog.set_uniform('u_color', 'vec4', color)
      @prog.set_uniform('u_linewidth', 'float', [16.0])#[@glyph.visuals.line.width.value()])
      @prog.set_uniform('u_antialias', 'float', [0.9])  # Smaller aa-region to obtain crisper images
      
      @prog.set_uniform('u_linecaps', 'vec2', [cap, cap])
      @prog.set_uniform('u_linejoin', 'float', [@JOIN[@glyph.visuals.line.join.value()]])
      @prog.set_uniform('u_miter_limit', 'float', [10.0])  # Should be a good value
      @prog.set_uniform('u_dash_phase', 'float', [@glyph.visuals.line.dash_offset.value()])
      
      #@prog.set_uniform('u_dash_period', 'float', [@glyph.visuals.line.xxx.value()])
      #@prog.set_uniform('u_dash_index', 'float', [@glyph.visuals.line.xxx.value()])
      @prog.set_uniform('u_dash_caps', 'vec2', [cap, cap])  # TODO: Check what canvas does
      @prog.set_uniform('u_closed', 'float', [0])  # TODO: we dont do closed lines; rip this out
    
    _bake: () ->
      console.log('BAAAAAAKING!!')
      # self.vtype = np.dtype( [('a_position', 'f4', 2),
      #                         ('a_segment',  'f4', 2),
      #                         ('a_angles',   'f4', 2),
      #                         ('a_tangents', 'f4', 4),
      #                         ('a_texcoord', 'f4', 2) ])
      
      # This is what you get if you port 50 lines of numpy code to JS.
                              
      # Init array of implicit shape nx2
      n = @nvertices
      _x = new Float32Array(@glyph.x)
      _y = new Float32Array(@glyph.y)
      
      # Init vertex data
      V_position = Vp = new Float32Array(n*2)
      V_segment = new Float32Array(n*2)
      V_angles = new Float32Array(n*2)
      V_tangents = Vt = new Float32Array(n*4)  # mind the 4!
      V_texcoord = new Float32Array(n*2)
            
      # Position
      for i in [0...n]
          V_position[i*2+0] = _x[i]
          V_position[i*2+1] = _y[i]
            
      # Tangents & norms
      T = new Float32Array(n*2-2)
      N = new Float32Array(n-1)
      for i in [0...n-1]
        T[i*2+0] = Vp[(i+1)*2+0] - Vp[i*2+0]
        T[i*2+1] = Vp[(i+1)*2+1] - Vp[i*2+1]
      
      for i in [0...n-1]
        N[i] = Math.sqrt(Math.pow(T[i*2+0], 2) + Math.pow(T[i*2+1], 2))
        
        # V['a_tangents'][+1:, :2] = T
        V_tangents[(i+1)*4+0] = T[i*2+0]
        V_tangents[(i+1)*4+1] = T[i*2+1]        
        # V['a_tangents'][:-1, 2:] = T
        V_tangents[i*4+2] = T[i*2+0]
        V_tangents[i*4+3] = T[i*2+1]
            
      # V['a_tangents'][0  , :2] = T[0]
      V_tangents[0*4+0] = T[0]
      V_tangents[0*4+1] = T[1]
      # V['a_tangents'][ -1, 2:] = T[-1]
      V_tangents[(n-1)*4+2] = T[(n-2)*2+0]
      V_tangents[(n-1)*4+3] = T[(n-2)*2+1]
      
      # Angles
      A = new Float32Array(n)
      for i in [0...n]
        A[i] = Math.atan2(Vt[i*4+0]*Vt[i*4+3] - Vt[i*4+1]*Vt[i*4+2],
                          Vt[i*4+0]*Vt[i*4+2] + Vt[i*4+1]*Vt[i*4+3])
      for i in [0...n-1]
        V_angles[i*2+0] = A[i]
        V_angles[i*2+1] = A[i+1]
         
      # Segment
      cumsum = 0
      for i in [0...n-1]
        cumsum += N[i]
        V_segment[(i+1)*2+0] = cumsum
        V_segment[i*2+1] = cumsum
            
      # Step 1: A -- B -- C  =>  A -- B, B' -- C
      
      # Repeat our array 4 times
      m = 4 * n - 4
      @V_position = V_position2 = new Float32Array(m*2)
      @V_segment = V_segment2 = new Float32Array(m*2)
      @V_angles = V_angles2 = new Float32Array(m*2)
      @V_tangents = V_tangents2 = new Float32Array(m*4)  # mind the 4!
      @V_texcoord = V_texcoord2 = new Float32Array(m*2)
      o = 2
      #
      # Arg, we really need an ndarray thing in JS :/
      for i in [0...n]  # all nodes on the line
         for j in [0...4]  # the four quad vertices
            for k in [0...2]  # xy
              V_position2[(i*4+j-o)*2+k] = V_position[i*2+k]
              V_segment2[(i*4+j)*2+k] = V_segment[i*2+k]  # no offset
              V_angles2[(i*4+j)*2+k] = V_angles[i*2+k]  # no offset
              #V_texcoord2[4*i*2+j*2+k] = V_texcoord[i*2+k]
            for k in [0...4]
              V_tangents2[(i*4+j-o)*4+k] = V_tangents[i*4+k]
      
      for i in [0..n]
        V_texcoord2[(i*4+0)*2+0] = -1
        V_texcoord2[(i*4+1)*2+0] = -1
        V_texcoord2[(i*4+2)*2+0] = +1
        V_texcoord2[(i*4+3)*2+0] = +1
        #
        V_texcoord2[(i*4+0)*2+1] = -1
        V_texcoord2[(i*4+1)*2+1] = +1
        V_texcoord2[(i*4+2)*2+1] = -1
        V_texcoord2[(i*4+3)*2+1] = +1
            
      # Indices
      #I = np.resize( np.array([0,1,2,1,2,3], dtype=np.uint32), (n-1)*(2*3))
      #I += np.repeat( 4*np.arange(n-1), 6)
      ni = (n-1) * 6
      @I_triangles = I = new Uint32Array(ni)
      for i in [0...n]
        I[i*6+0] = 0 + 4*i
        I[i*6+1] = 1 + 4*i
        I[i*6+2] = 2 + 4*i
        I[i*6+3] = 1 + 4*i
        I[i*6+4] = 2 + 4*i
        I[i*6+5] = 3 + 4*i
      if 1
        for i in [0...n]
          I[i*6+0] = 0 + 4*i
          I[i*6+1] = 1 + 4*i
          I[i*6+2] = 3 + 4*i
          I[i*6+3] = 2 + 4*i
          I[i*6+4] = 0 + 4*i
          I[i*6+5] = 3 + 4*i     
      # todo: if I is larger than 65k, we need to draw in parts
      @cumsum = cumsum  # L[-1] in Nico's code

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
        
        // If fg alpha is zero, it probably means no outline. To avoid a dark outline
        // shining through due to aa, we set the fg color to the bg color. Avoid if (i.e. branching).
        float select = float(bool(fg_color.a));
        fg_color.rgb = select * fg_color.rgb + (1.0  - select) * bg_color.rgb;
        // Similarly, if we want a transparent bg
        select = float(bool(bg_color.a));
        bg_color.rgb = select * bg_color.rgb + (1.0  - select) * fg_color.rgb;
        
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
        //gl_FragColor.rgb *= gl_FragColor.a;  // pre-multiply alpha
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
    # Real attributes
    @vbo_x = new gloo2.VertexBuffer(gl)
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
    
    # Handle transformation to device coordinates
    @prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height])
    @prog.set_uniform('u_offset', 'vec2', [trans.dx[0], trans.dy[0]])
    @prog.set_uniform('u_scale', 'vec2', [trans.sx, trans.sy])
    
    # Select buffers from main glyph 
    # (which may be this glyph but maybe not if this is a (non)selection glyph)
    @prog.set_attribute('a_x', 'float', [mainGlyph.glglyph.vbo_x, 0, 0])
    @prog.set_attribute('a_y', 'float', [mainGlyph.glglyph.vbo_y, 0, 0])
    @prog.set_attribute('a_size', 'float', [mainGlyph.glglyph.vbo_s, 0, 0])
    @prog.set_attribute('a_angle', 'float', [mainGlyph.glglyph.vbo_a, 0, 0])
    
    # Draw directly or using indices. Do not handle indices if they do not 
    # fit in a uint16; WebGL 1.0 does not support uint32.
    if indices.length == 0
      return
    else if indices.length == nvertices
      @prog.draw(@gl.POINTS, [0, nvertices])
    else if nvertices < 65535
      @index_buffer.set_size(indices.length*2)
      @index_buffer.set_data(0, new Uint16Array(indices))
      @prog.draw(@gl.POINTS, @index_buffer)
    else
      # Work around the limit that the indexbuffer must be uint16. We draw in chunks.
      # First collect indices in chunks
      chunksize = 64000  # 65536
      chunks = []
      for i in [0...Math.ceil(nvertices/chunksize)]
         chunks.push([])
      for i in [0...indices.length]
        uint16_index = indices[i] % chunksize
        chunk = Math.floor(indices[i] / chunksize)
        chunks[chunk].push(uint16_index)
      # Then draw each chunk
      for chunk in [0...chunks.length]
        these_indices = new Uint16Array(chunks[chunk])
        offset = chunk * chunksize * 4
        if these_indices.length == 0
          continue
        @prog.set_attribute('a_x', 'float', [mainGlyph.glglyph.vbo_x, 0, offset])
        @prog.set_attribute('a_y', 'float', [mainGlyph.glglyph.vbo_y, 0, offset])
        @prog.set_attribute('a_size', 'float', [mainGlyph.glglyph.vbo_s, 0, offset])
        @prog.set_attribute('a_angle', 'float', [mainGlyph.glglyph.vbo_a, 0, offset])
        if @vbo_linewidth.used
          @prog.set_attribute('a_linewidth', 'float', [@vbo_linewidth, 0, offset])
        if @vbo_fg_color.used
          @prog.set_attribute('a_fg_color', 'vec4', [@vbo_fg_color, 0, offset * 4])
        if @vbo_bg_color.used
          @prog.set_attribute('a_bg_color', 'vec4', [@vbo_bg_color, 0, offset * 4])
        # The actual drawing
        @index_buffer.set_size(these_indices.length*2)
        @index_buffer.set_data(0, these_indices)
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


module.exports =
  CircleGLGlyph: CircleGLGlyph
  SquareGLGlyph: SquareGLGlyph
  LineGLGlyph: LineGLGlyph
