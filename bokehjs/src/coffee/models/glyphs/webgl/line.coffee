import * as gloo2 from "gloo2"
import {logger} from "core/logging"
import {color2rgba} from "core/util/color"
import {BaseGLGlyph, line_width, attach_float, attach_color} from "./base"

class DashAtlas

  constructor: (gl) ->
    @_atlas = {}
    @_index = 0
    @_width = 256
    @_height = 256
    # Init texture
    @tex = new gloo2.Texture2D(gl)
    @tex.set_wrapping(gl.REPEAT, gl.REPEAT)
    @tex.set_interpolation(gl.NEAREST, gl.NEAREST)
    @tex.set_size([@_height, @_width], gl.RGBA)
    @tex.set_data([0, 0], [@_height, @_width], new Uint8Array(@_height * @_width * 4))
    # Init with solid line (index 0 is reserved for this)
    @get_atlas_data([1])

  get_atlas_data: (pattern) ->
    key = pattern.join('-')
    findex_period = @_atlas[key]
    if findex_period is undefined
      [data, period] = @make_pattern(pattern)
      @tex.set_data([@_index, 0], [1, @_width], new Uint8Array(x+10 for x in data))
      @_atlas[key] = [@_index / @_height, period]
      @_index += 1
    return @_atlas[key]

  make_pattern: (pattern) ->
    # A pattern is defined as on/off sequence of segments
    # It must be a multiple of 2
    if pattern.length > 1 and pattern.length % 2
      pattern = pattern.concat(pattern)
    # Period is sum of elements
    period = 0
    for v in pattern
       period += v
    # Find all start and end of on-segment only
    C = []; c = 0
    for i in [0...pattern.length+2] by 2
        a = Math.max(0.0001, pattern[i % pattern.length])
        b = Math.max(0.0001, pattern[(i+1) % pattern.length])
        C.push.apply(C, [c, c + a])  # == extend
        c += a + b
    # Build pattern
    n = @_width
    Z = new Float32Array(n * 4)
    for i in [0...n]
        x = period * i / (n-1)
        # get index at min - index = np.argmin(abs(C-(x)))
        index = 0; val_at_index = 1e16
        for j in [0...C.length]
          val = Math.abs(C[j]-x)
          if val < val_at_index
             index = j; val_at_index = val
        if index % 2 == 0
          dash_type = if (x <= C[index]) then +1 else 0
          dash_start = C[index]; dash_end = C[index+1]
        else
          dash_type = if (x > C[index]) then -1 else 0
          dash_start = C[index-1]; dash_end = C[index]
        Z[i*4+0] = C[index]
        Z[i*4+1] = dash_type
        Z[i*4+2] = dash_start
        Z[i*4+3] = dash_end
    return [Z, period]


export class LineGLGlyph extends BaseGLGlyph

    GLYPH: 'line'

    JOINS:
      'miter': 0, 'round': 1, 'bevel': 2

    CAPS:
      '': 0, 'none': 0, '.': 0,
      'round': 1, ')': 1, '(': 1, 'o': 1,
      'triangle in': 2, '<': 2,
      'triangle out': 3, '>': 3,
      'square': 4, '[': 4, ']': 4, '=': 4,
      'butt': 5, '|': 5

    VERT: """
      precision mediump float;

      const float PI = 3.14159265358979323846264;
      const float THETA = 15.0 * 3.14159265358979323846264/180.0;

      uniform float u_pixel_ratio;
      uniform vec2 u_canvas_size, u_offset;
      uniform vec2 u_scale_aspect;
      uniform float u_scale_length;

      uniform vec4 u_color;
      uniform float u_antialias;
      uniform float u_length;
      uniform float u_linewidth;
      uniform float u_dash_index;
      uniform float u_closed;

      attribute vec2 a_position;
      attribute vec4 a_tangents;
      attribute vec2 a_segment;
      attribute vec2 a_angles;
      attribute vec2 a_texcoord;

      varying vec4  v_color;
      varying vec2  v_segment;
      varying vec2  v_angles;
      varying vec2  v_texcoord;
      varying vec2  v_miter;
      varying float v_length;
      varying float v_linewidth;

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
          bool closed = (u_closed > 0.0);

          // Attributes and uniforms to varyings
          v_color = u_color;
          v_linewidth = u_linewidth;
          v_segment = a_segment * u_scale_length;
          v_length = u_length * u_scale_length;

          // Scale to map to pixel coordinates. The original algorithm from the paper
          // assumed isotropic scale. We obviously do not have this.
          vec2 abs_scale_aspect = abs(u_scale_aspect);
          vec2 abs_scale = u_scale_length * abs_scale_aspect;

          // Correct angles for aspect ratio
          vec2 av;
          av = vec2(1.0, tan(a_angles.x)) / abs_scale_aspect;
          v_angles.x = atan(av.y, av.x);
          av = vec2(1.0, tan(a_angles.y)) / abs_scale_aspect;
          v_angles.y = atan(av.y, av.x);

          // Thickness below 1 pixel are represented using a 1 pixel thickness
          // and a modified alpha
          v_color.a = min(v_linewidth, v_color.a);
          v_linewidth = max(v_linewidth, 1.0);

          // If color is fully transparent we just will discard the fragment anyway
          if( v_color.a <= 0.0 ) {
              gl_Position = vec4(0.0,0.0,0.0,1.0);
              return;
          }

          // This is the actual half width of the line
          float w = ceil(u_antialias+v_linewidth)/2.0;

          vec2 position = (a_position + u_offset) * abs_scale;

          vec2 t1 = normalize(a_tangents.xy * abs_scale_aspect);  // note the scaling for aspect ratio here
          vec2 t2 = normalize(a_tangents.zw * abs_scale_aspect);
          float u = a_texcoord.x;
          float v = a_texcoord.y;
          vec2 o1 = vec2( +t1.y, -t1.x);
          vec2 o2 = vec2( +t2.y, -t2.x);

          // This is a join
          // ----------------------------------------------------------------
          if( t1 != t2 ) {
              float angle = atan (t1.x*t2.y-t1.y*t2.x, t1.x*t2.x+t1.y*t2.y);  // Angle needs recalculation for some reason
              vec2 t  = normalize(t1+t2);
              vec2 o  = vec2( + t.y, - t.x);

              if ( u_dash_index > 0.0 )
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
          vec2 curr = a_position * abs_scale;
          if( a_texcoord.x < 0.0 ) {
              vec2 next = curr + t2*(v_segment.y-v_segment.x);

              rotate( t1, +v_angles.x/2.0, t);
              v_miter.x = signed_distance(curr, curr+t, position);

              rotate( t2, +v_angles.y/2.0, t);
              v_miter.y = signed_distance(next, next+t, position);
          } else {
              vec2 prev = curr - t1*(v_segment.y-v_segment.x);

              rotate( t1, -v_angles.x/2.0,t);
              v_miter.x = signed_distance(prev, prev+t, position);

              rotate( t2, -v_angles.y/2.0,t);
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
          // already scaled with abs scale above.
          vec2 normpos = position * sign(u_scale_aspect);
          normpos += 0.5;  // make up for Bokeh's offset
          normpos /= u_canvas_size / u_pixel_ratio;  // in 0..1
          gl_Position = vec4(normpos*2.0-1.0, 0.0, 1.0);
          gl_Position.y *= -1.0;
      }

    """

    FRAG_: """
      // Fragment shader that can be convenient during debugging to show the line skeleton.
      precision mediump float;
      uniform vec4  u_color;
      void main () {
        gl_FragColor = u_color;
      }
    """

    FRAG: """
      precision mediump float;

      const float PI = 3.14159265358979323846264;
      const float THETA = 15.0 * 3.14159265358979323846264/180.0;

      uniform sampler2D u_dash_atlas;

      uniform vec2 u_linecaps;
      uniform float u_miter_limit;
      uniform float u_linejoin;
      uniform float u_antialias;
      uniform float u_dash_phase;
      uniform float u_dash_period;
      uniform float u_dash_index;
      uniform vec2 u_dash_caps;
      uniform float u_closed;

      varying vec4  v_color;
      varying vec2  v_segment;
      varying vec2  v_angles;
      varying vec2  v_texcoord;
      varying vec2  v_miter;
      varying float v_length;
      varying float v_linewidth;

      // Compute distance to cap ----------------------------------------------------
      float cap( int type, float dx, float dy, float t, float linewidth )
      {
          float d = 0.0;
          dx = abs(dx);
          dy = abs(dy);
          if      (type == 0)  discard;  // None
          else if (type == 1)  d = sqrt(dx*dx+dy*dy);  // Round
          else if (type == 3)  d = (dx+abs(dy));  // Triangle in
          else if (type == 2)  d = max(abs(dy),(t+dx-abs(dy)));  // Triangle out
          else if (type == 4)  d = max(dx,dy);  // Square
          else if (type == 5)  d = max(dx+t,dy);  // Butt
          return d;
      }

      // Compute distance to join -------------------------------------------------
      float join( in int type, in float d, in vec2 segment, in vec2 texcoord, in vec2 miter,
                 in float linewidth )
      {
          // texcoord.x is distance from start
          // texcoord.y is distance from centerline
          // segment.x and y indicate the limits (as for texcoord.x) for this segment

          float dx = texcoord.x;

          // Round join
          if( type == 1 ) {
              if (dx < segment.x) {
                  d = max(d,length( texcoord - vec2(segment.x,0.0)));
                  //d = length( texcoord - vec2(segment.x,0.0));
              } else if (dx > segment.y) {
                  d = max(d,length( texcoord - vec2(segment.y,0.0)));
                  //d = length( texcoord - vec2(segment.y,0.0));
              }
          }
          // Bevel join
          else if ( type == 2 ) {
              if (dx < segment.x) {
                  vec2 x = texcoord - vec2(segment.x,0.0);
                  d = max(d, max(abs(x.x), abs(x.y)));

              } else if (dx > segment.y) {
                  vec2 x = texcoord - vec2(segment.y,0.0);
                  d = max(d, max(abs(x.x), abs(x.y)));
              }
              /*  Original code for bevel which does not work for us
              if( (dx < segment.x) ||  (dx > segment.y) )
                  d = max(d, min(abs(x.x),abs(x.y)));
              */
          }

          return d;
      }

      void main()
      {
          // If color is fully transparent we just discard the fragment
          if( v_color.a <= 0.0 ) {
              discard;
          }

          // Test if dash pattern is the solid one (0)
          bool solid =  (u_dash_index == 0.0);

          // Test if path is closed
          bool closed = (u_closed > 0.0);

          vec4 color = v_color;
          float dx = v_texcoord.x;
          float dy = v_texcoord.y;
          float t = v_linewidth/2.0-u_antialias;
          float width = 1.0;  //v_linewidth; original code had dashes scale with line width, we do not
          float d = 0.0;

          vec2 linecaps = u_linecaps;
          vec2 dash_caps = u_dash_caps;
          float line_start = 0.0;
          float line_stop = v_length;

          // Apply miter limit; fragments too far into the miter are simply discarded
          if( (dx < v_segment.x) || (dx > v_segment.y) ) {
              float into_miter = max(v_segment.x - dx, dx - v_segment.y);
              if (into_miter > u_miter_limit*v_linewidth/2.0)
                discard;
          }

          // Solid line --------------------------------------------------------------
          if( solid ) {
              d = abs(dy);
              if( (!closed) && (dx < line_start) ) {
                  d = cap( int(u_linecaps.x), abs(dx), abs(dy), t, v_linewidth );
              }
              else if( (!closed) &&  (dx > line_stop) ) {
                  d = cap( int(u_linecaps.y), abs(dx)-line_stop, abs(dy), t, v_linewidth );
              }
              else {
                  d = join( int(u_linejoin), abs(dy), v_segment, v_texcoord, v_miter, v_linewidth );
              }

          // Dash line --------------------------------------------------------------
          } else {
              float segment_start = v_segment.x;
              float segment_stop  = v_segment.y;
              float segment_center= (segment_start+segment_stop)/2.0;
              float freq          = u_dash_period*width;
              float u = mod( dx + u_dash_phase*width, freq);
              vec4 tex = texture2D(u_dash_atlas, vec2(u/freq, u_dash_index)) * 255.0 -10.0;  // conversion to int-like
              float dash_center= tex.x * width;
              float dash_type  = tex.y;
              float _start = tex.z * width;
              float _stop  = tex.a * width;
              float dash_start = dx - u + _start;
              float dash_stop  = dx - u + _stop;

              // Compute extents of the first dash (the one relative to v_segment.x)
              // Note: this could be computed in the vertex shader
              if( (dash_stop < segment_start) && (dash_caps.x != 5.0) ) {
                  float u = mod(segment_start + u_dash_phase*width, freq);
                  vec4 tex = texture2D(u_dash_atlas, vec2(u/freq, u_dash_index)) * 255.0 -10.0;  // conversion to int-like
                  dash_center= tex.x * width;
                  //dash_type  = tex.y;
                  float _start = tex.z * width;
                  float _stop  = tex.a * width;
                  dash_start = segment_start - u + _start;
                  dash_stop = segment_start - u + _stop;
              }

              // Compute extents of the last dash (the one relatives to v_segment.y)
              // Note: This could be computed in the vertex shader
              else if( (dash_start > segment_stop)  && (dash_caps.y != 5.0) ) {
                  float u = mod(segment_stop + u_dash_phase*width, freq);
                  vec4 tex = texture2D(u_dash_atlas, vec2(u/freq, u_dash_index)) * 255.0 -10.0;  // conversion to int-like
                  dash_center= tex.x * width;
                  //dash_type  = tex.y;
                  float _start = tex.z * width;
                  float _stop  = tex.a * width;
                  dash_start = segment_stop - u + _start;
                  dash_stop  = segment_stop - u + _stop;
              }

              // This test if the we are dealing with a discontinuous angle
              bool discontinuous = ((dx <  segment_center) && abs(v_angles.x) > THETA) ||
                                   ((dx >= segment_center) && abs(v_angles.y) > THETA);
              //if( dx < line_start) discontinuous = false;
              //if( dx > line_stop)  discontinuous = false;

              float d_join = join( int(u_linejoin), abs(dy),
                                  v_segment, v_texcoord, v_miter, v_linewidth );

              // When path is closed, we do not have room for linecaps, so we make room
              // by shortening the total length
              if (closed) {
                   line_start += v_linewidth/2.0;
                   line_stop  -= v_linewidth/2.0;
              }

              // We also need to take antialias area into account
              //line_start += u_antialias;
              //line_stop  -= u_antialias;

              // Check is dash stop is before line start
              if( dash_stop <= line_start ) {
                  discard;
              }
              // Check is dash start is beyond line stop
              if( dash_start >= line_stop ) {
                  discard;
              }

              // Check if current dash start is beyond segment stop
              if( discontinuous ) {
                  // Dash start is beyond segment, we discard
                  if( (dash_start > segment_stop) ) {
                      discard;
                      //gl_FragColor = vec4(1.0,0.0,0.0,.25); return;
                  }

                  // Dash stop is before segment, we discard
                  if( (dash_stop < segment_start) ) {
                      discard;  //gl_FragColor = vec4(0.0,1.0,0.0,.25); return;
                  }

                  // Special case for round caps (nicer with this)
                  if( dash_caps.x == 1.0 ) {
                      if( (u > _stop) && (dash_stop > segment_stop )  && (abs(v_angles.y) < PI/2.0)) {
                          discard;
                      }
                  }

                  // Special case for round caps  (nicer with this)
                  if( dash_caps.y == 1.0 ) {
                      if( (u < _start) && (dash_start < segment_start )  && (abs(v_angles.x) < PI/2.0)) {
                          discard;
                      }
                  }

                  // Special case for triangle caps (in & out) and square
                  // We make sure the cap stop at crossing frontier
                  if( (dash_caps.x != 1.0) && (dash_caps.x != 5.0) ) {
                      if( (dash_start < segment_start )  && (abs(v_angles.x) < PI/2.0) ) {
                          float a = v_angles.x/2.0;
                          float x = (segment_start-dx)*cos(a) - dy*sin(a);
                          float y = (segment_start-dx)*sin(a) + dy*cos(a);
                          if( x > 0.0 ) discard;
                          // We transform the cap into square to avoid holes
                          dash_caps.x = 4.0;
                      }
                  }

                  // Special case for triangle caps (in & out) and square
                  // We make sure the cap stop at crossing frontier
                  if( (dash_caps.y != 1.0) && (dash_caps.y != 5.0) ) {
                      if( (dash_stop > segment_stop )  && (abs(v_angles.y) < PI/2.0) ) {
                          float a = v_angles.y/2.0;
                          float x = (dx-segment_stop)*cos(a) - dy*sin(a);
                          float y = (dx-segment_stop)*sin(a) + dy*cos(a);
                          if( x > 0.0 ) discard;
                          // We transform the caps into square to avoid holes
                          dash_caps.y = 4.0;
                      }
                  }
              }

              // Line cap at start
              if( (dx < line_start) && (dash_start < line_start) && (dash_stop > line_start) ) {
                  d = cap( int(linecaps.x), dx-line_start, dy, t, v_linewidth);
              }
              // Line cap at stop
              else if( (dx > line_stop) && (dash_stop > line_stop) && (dash_start < line_stop) ) {
                  d = cap( int(linecaps.y), dx-line_stop, dy, t, v_linewidth);
              }
              // Dash cap left - dash_type = -1, 0 or 1, but there may be roundoff errors
              else if( dash_type < -0.5 ) {
                  d = cap( int(dash_caps.y), abs(u-dash_center), dy, t, v_linewidth);
                  if( (dx > line_start) && (dx < line_stop) )
                      d = max(d,d_join);
              }
              // Dash cap right
              else if( dash_type > 0.5 ) {
                  d = cap( int(dash_caps.x), abs(dash_center-u), dy, t, v_linewidth);
                  if( (dx > line_start) && (dx < line_stop) )
                      d = max(d,d_join);
              }
              // Dash body (plain)
              else {// if( dash_type > -0.5 &&  dash_type < 0.5) {
                  d = abs(dy);
              }

              // Line join
              if( (dx > line_start) && (dx < line_stop)) {
                  if( (dx <= segment_start) && (dash_start <= segment_start)
                      && (dash_stop >= segment_start) ) {
                      d = d_join;
                      // Antialias at outer border
                      float angle = PI/2.+v_angles.x;
                      float f = abs( (segment_start - dx)*cos(angle) - dy*sin(angle));
                      d = max(f,d);
                  }
                  else if( (dx > segment_stop) && (dash_start <= segment_stop)
                           && (dash_stop >= segment_stop) ) {
                      d = d_join;
                      // Antialias at outer border
                      float angle = PI/2.+v_angles.y;
                      float f = abs((dx - segment_stop)*cos(angle) - dy*sin(angle));
                      d = max(f,d);
                  }
                  else if( dx < (segment_start - v_linewidth/2.)) {
                      discard;
                  }
                  else if( dx > (segment_stop + v_linewidth/2.)) {
                      discard;
                  }
              }
              else if( dx < (segment_start - v_linewidth/2.)) {
                  discard;
              }
              else if( dx > (segment_stop + v_linewidth/2.)) {
                  discard;
              }
          }

          // Distance to border ------------------------------------------------------
          d = d - t;
          if( d < 0.0 ) {
              gl_FragColor = color;
          } else {
              d /= u_antialias;
              gl_FragColor = vec4(color.rgb, exp(-d*d)*color.a);
          }
      }
    """

    init: () ->
      gl = @gl
      @_scale_aspect = 0  # keep track, so we know when we need to update segment data

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
      # Dash atlas
      @dash_atlas = new DashAtlas(gl)

    draw: (indices, mainGlyph, trans) ->
      mainGlGlyph = mainGlyph.glglyph

      if mainGlGlyph.data_changed
        if not (isFinite(trans.dx) and isFinite(trans.dy))
          return  # not sure why, but it happens on init sometimes (#4367)
        mainGlGlyph._baked_offset = [trans.dx, trans.dy]  # float32 precision workaround; used in _bake() and below
        mainGlGlyph._set_data()
        mainGlGlyph.data_changed = false
      if @visuals_changed
        @_set_visuals()
        @visuals_changed = false

      # Decompose x-y scale into scalar scale and aspect-vector.
      sx = trans.sx; sy = trans.sy;
      scale_length = Math.sqrt(sx * sx + sy * sy)
      sx /= scale_length; sy /= scale_length

      # Do we need to re-calculate segment data and cumsum?
      if Math.abs(@_scale_aspect - (sy / sx)) > Math.abs(1e-3 * @_scale_aspect)
        mainGlGlyph._update_scale(sx, sy)
        @_scale_aspect = sy / sx

      # Select buffers from main glyph
      # (which may be this glyph but maybe not if this is a (non)selection glyph)
      @prog.set_attribute('a_position', 'vec2', mainGlGlyph.vbo_position)
      @prog.set_attribute('a_tangents', 'vec4', mainGlGlyph.vbo_tangents)
      @prog.set_attribute('a_segment', 'vec2', mainGlGlyph.vbo_segment)
      @prog.set_attribute('a_angles', 'vec2', mainGlGlyph.vbo_angles)
      @prog.set_attribute('a_texcoord', 'vec2', mainGlGlyph.vbo_texcoord)
      #
      @prog.set_uniform('u_length', 'float', [mainGlGlyph.cumsum])
      @prog.set_texture('u_dash_atlas', @dash_atlas.tex)

      # Handle transformation to device coordinates
      baked_offset = mainGlGlyph._baked_offset
      @prog.set_uniform('u_pixel_ratio', 'float', [trans.pixel_ratio])
      @prog.set_uniform('u_canvas_size', 'vec2', [trans.width, trans.height])
      @prog.set_uniform('u_offset', 'vec2', [trans.dx - baked_offset[0], trans.dy - baked_offset[1]])
      @prog.set_uniform('u_scale_aspect', 'vec2', [sx, sy])
      @prog.set_uniform('u_scale_length', 'float', [scale_length])

      @I_triangles = mainGlGlyph.I_triangles
      if @I_triangles.length < 65535
        # Data is small enough to draw in one pass
        @index_buffer.set_size(@I_triangles.length*2)
        @index_buffer.set_data(0, new Uint16Array(@I_triangles))
        @prog.draw(@gl.TRIANGLES, @index_buffer)
        # @prog.draw(@gl.LINE_STRIP, @index_buffer)  # Use this to draw the line skeleton
      else
        # Work around the limit that the indexbuffer must be uint16. We draw in chunks.
        # First collect indices in chunks
        indices = @I_triangles
        nvertices = @I_triangles.length
        chunksize = 64008  # 65536 max. 64008 is divisible by 12
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
          @prog.set_attribute('a_position', 'vec2', mainGlGlyph.vbo_position, 0, offset * 2)
          @prog.set_attribute('a_tangents', 'vec4', mainGlGlyph.vbo_tangents, 0, offset * 4)
          @prog.set_attribute('a_segment', 'vec2', mainGlGlyph.vbo_segment, 0, offset * 2)
          @prog.set_attribute('a_angles', 'vec2', mainGlGlyph.vbo_angles, 0, offset * 2)
          @prog.set_attribute('a_texcoord', 'vec2', mainGlGlyph.vbo_texcoord, 0, offset * 2)
          # The actual drawing
          @index_buffer.set_size(these_indices.length*2)
          @index_buffer.set_data(0, these_indices)
          @prog.draw(@gl.TRIANGLES, @index_buffer)

    _set_data: () ->
      @_bake()

      @vbo_position.set_size(@V_position.length*4);
      @vbo_position.set_data(0, @V_position)

      @vbo_tangents.set_size(@V_tangents.length*4)
      @vbo_tangents.set_data(0, @V_tangents)

      @vbo_angles.set_size(@V_angles.length*4)
      @vbo_angles.set_data(0, @V_angles)

      @vbo_texcoord.set_size(@V_texcoord.length*4)
      @vbo_texcoord.set_data(0, @V_texcoord)

    _set_visuals: () ->

      color = color2rgba(@glyph.visuals.line.line_color.value(), @glyph.visuals.line.line_alpha.value())
      cap = @CAPS[@glyph.visuals.line.line_cap.value()]
      join = @JOINS[@glyph.visuals.line.line_join.value()]

      @prog.set_uniform('u_color', 'vec4', color)
      @prog.set_uniform('u_linewidth', 'float', [@glyph.visuals.line.line_width.value()])
      @prog.set_uniform('u_antialias', 'float', [0.9])  # Smaller aa-region to obtain crisper images

      @prog.set_uniform('u_linecaps', 'vec2', [cap, cap])
      @prog.set_uniform('u_linejoin', 'float', [join])
      @prog.set_uniform('u_miter_limit', 'float', [10.0])  # 10 should be a good value
      # https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-miterlimit

      dash_pattern = @glyph.visuals.line.line_dash.value()
      dash_index = 0; dash_period = 1
      if dash_pattern.length
        [dash_index, dash_period] = @dash_atlas.get_atlas_data(dash_pattern)
      @prog.set_uniform('u_dash_index', 'float', [dash_index])  # 0 means solid line
      @prog.set_uniform('u_dash_phase', 'float', [@glyph.visuals.line.line_dash_offset.value()])
      @prog.set_uniform('u_dash_period', 'float', [dash_period])
      @prog.set_uniform('u_dash_caps', 'vec2', [cap, cap])
      @prog.set_uniform('u_closed', 'float', [0])  # We dont do closed lines

    _bake: () ->
      # This is what you get if you port 50 lines of numpy code to JS.
      # V_segment is handled in another method, because it depends on the aspect
      # ratio of the scale (The original paper/code assumed isotropic scaling).
      #
      # Buffer dtype from the Python implementation:
      #
      # self.vtype = np.dtype( [('a_position', 'f4', 2),
      #                         ('a_segment',  'f4', 2),
      #                         ('a_angles',   'f4', 2),
      #                         ('a_tangents', 'f4', 4),
      #                         ('a_texcoord', 'f4', 2) ])

      # Init array of implicit shape nx2
      n = @nvertices
      _x = new Float64Array(@glyph._x)
      _y = new Float64Array(@glyph._y)

      # Init vertex data
      V_position = Vp = new Float32Array(n*2)
      #V_segment = new Float32Array(n*2)  # Done later
      V_angles = new Float32Array(n*2)
      V_tangents = Vt = new Float32Array(n*4)  # mind the 4!
      V_texcoord = new Float32Array(n*2)

      # Position
      for i in [0...n]
          V_position[i*2+0] = _x[i] + @_baked_offset[0]
          V_position[i*2+1] = _y[i] + @_baked_offset[1]

      # Tangents & norms (need tangents to calculate segments based on scale)
      @tangents = T = new Float32Array(n*2-2)
      for i in [0...n-1]
        T[i*2+0] = Vp[(i+1)*2+0] - Vp[i*2+0]
        T[i*2+1] = Vp[(i+1)*2+1] - Vp[i*2+1]

      for i in [0...n-1]
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

      # Step 1: A -- B -- C  =>  A -- B, B' -- C

      # Repeat our array 4 times
      m = 4 * n - 4
      @V_position = V_position2 = new Float32Array(m*2)
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
              V_angles2[(i*4+j)*2+k] = V_angles[i*2+k]  # no offset
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
      # Order of indices is such that drawing as line_strip reveals the line skeleton
      # Might have implications on culling, if we ever turn that on.
      # Order in paper was: 0 1 2 1 2 3
      for i in [0...n]
        I[i*6+0] = 0 + 4*i
        I[i*6+1] = 1 + 4*i
        I[i*6+2] = 3 + 4*i
        I[i*6+3] = 2 + 4*i
        I[i*6+4] = 0 + 4*i
        I[i*6+5] = 3 + 4*i

    _update_scale: (sx, sy) ->
      # Update segment data and cumsum so the length along the line has the
      # scale aspect ratio in it. In the vertex shader we multiply with the
      # "isotropic part" of the scale.

      n = @nvertices
      m = 4 * n - 4
      # Prepare arrays
      T = @tangents
      N = new Float32Array(n-1)
      V_segment = new Float32Array(n*2)  # Elements are initialized with 0
      @V_segment = V_segment2 = new Float32Array(m*2)
      # Calculate vector lengths - with scale aspect ratio taken into account
      for i in [0...n-1]
        N[i] = Math.sqrt(Math.pow(T[i*2+0] * sx, 2) + Math.pow(T[i*2+1] * sy, 2))
      # Calculate Segments
      cumsum = 0
      for i in [0...n-1]
        cumsum += N[i]
        V_segment[(i+1)*2+0] = cumsum
        V_segment[i*2+1] = cumsum
      # Upscale (same loop as in _bake())
      for i in [0...n]
         for j in [0...4]
            for k in [0...2]
              V_segment2[(i*4+j)*2+k] = V_segment[i*2+k]
      # Update
      @cumsum = cumsum  # L[-1] in Nico's code
      @vbo_segment.set_size(@V_segment.length*4)
      @vbo_segment.set_data(0, @V_segment)
