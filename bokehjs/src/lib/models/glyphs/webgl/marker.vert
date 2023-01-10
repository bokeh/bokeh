precision mediump float;

attribute vec2 a_position;
attribute vec2 a_center;
attribute float a_width;   // or radius or outer_radius
attribute float a_height;  // or inner_radius
attribute float a_angle;   // or start_angle
attribute float a_aux;     // or end_angle
attribute float a_linewidth;
attribute vec4 a_line_color;
attribute vec4 a_fill_color;
attribute float a_line_cap;
attribute float a_line_join;
attribute float a_show;

#ifdef HATCH
attribute float a_hatch_pattern;
attribute float a_hatch_scale;
attribute float a_hatch_weight;
attribute vec4 a_hatch_color;
#endif

uniform float u_pixel_ratio;
uniform vec2 u_canvas_size;
uniform float u_antialias;

#ifdef MULTI_MARKER
uniform float u_size_hint;
#endif

#ifdef USE_RECT
uniform vec4 u_border_radius;
varying vec4 v_border_radius;
#endif

#ifdef USE_ANNULAR_WEDGE
varying float v_outer_radius;
varying float v_inner_radius;
varying float v_start_angle;
varying float v_end_angle;
#endif

#ifdef USE_ANNULUS
varying float v_outer_radius;
varying float v_inner_radius;
#endif

#ifdef USE_WEDGE
varying float v_radius;
varying float v_start_angle;
varying float v_end_angle;
#endif

#ifdef USE_CIRCLE
varying float v_radius;
#endif

varying float v_linewidth;
varying vec2 v_size; // 2D size for rects compared to 1D for markers.
varying vec4 v_line_color;
varying vec4 v_fill_color;
varying float v_line_cap;
varying float v_line_join;
varying vec2 v_coords;

#ifdef HATCH
varying float v_hatch_pattern;
varying float v_hatch_scale;
varying float v_hatch_weight;
varying vec4 v_hatch_color;
varying vec2 v_hatch_coords;
#endif

#ifdef MULTI_MARKER

#define M_DASH         1
#define M_DOT          2
#define M_DIAMOND      3
#define M_HEX          4
#define M_SQUARE_PIN   5
#define M_TRIANGLE     6
#define M_TRIANGLE_PIN 7
#define M_STAR         8

vec2 enclosing_size() {
  // Need extra size of (v_linewidth+u_antialias) if edge of marker parallel to
  // edge of bounding box.  If symmetric spike towards edge then multiply by
  // 1/cos(theta) where theta is angle between spike and bbox edges.
  int size_hint = int(u_size_hint + 0.5);
  if (size_hint == M_DASH)
    return vec2(v_size.x + v_linewidth + u_antialias,
                           v_linewidth + u_antialias);
  else if (size_hint == M_DOT)
    return 0.25*v_size + u_antialias;
  else if (size_hint == M_DIAMOND)
    return vec2(v_size.x*(2.0/3.0) + (v_linewidth + u_antialias)*1.20185,
                v_size.y + (v_linewidth + u_antialias)*1.80278);
  else if (size_hint == M_HEX)
    return v_size + (v_linewidth + u_antialias)*vec2(2.0/sqrt(3.0), 1.0);
  else if (size_hint == M_SQUARE_PIN)  // Square pin
    return v_size + (v_linewidth + u_antialias)*3.1;
  else if (size_hint == M_TRIANGLE)
    return vec2(v_size.x + (v_linewidth + u_antialias)*sqrt(3.0),
                v_size.y*(2.0/sqrt(3.0)) + (v_linewidth + u_antialias)*2.0);
  else if (size_hint == M_TRIANGLE_PIN)
    return v_size + (v_linewidth + u_antialias)*vec2(4.8, 6.0);
  else if (size_hint == M_STAR)
    return vec2(v_size.x*0.95106 + (v_linewidth + u_antialias)*3.0,
                v_size.y + (v_linewidth + u_antialias)*3.2);
  else
    return v_size + v_linewidth + u_antialias;
}
#else
vec2 enclosing_size() {
  return v_size + v_linewidth + u_antialias;
}
#endif

void main()
{
#if defined(USE_RECT) || defined(USE_HEX) || defined(USE_ELLIPSE)
  v_size = vec2(a_width, a_height);
#elif defined(USE_CIRCLE) || defined(USE_ANNULUS) || defined(USE_ANNULAR_WEDGE) || defined(USE_WEDGE)
  v_size = vec2(2.0*a_width, 2.0*a_width);
#else
  v_size = vec2(a_width, a_width);
#endif

  if (a_show < 0.5 || v_size.x <= 0.0 || v_size.y <= 0.0) {
    // Do not show this rect.
    gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
    return;
  }

#ifdef USE_ANNULAR_WEDGE
  v_outer_radius = a_width;
  v_inner_radius = a_height;
  v_start_angle = -a_angle;
  v_end_angle = -a_aux;
#endif

#ifdef USE_ANNULUS
  v_outer_radius = a_width;
  v_inner_radius = a_height;
#endif

#ifdef USE_WEDGE
  v_radius = a_width;
  v_start_angle = -a_angle;
  v_end_angle = -a_aux;
#endif

#ifdef USE_CIRCLE
  v_radius = a_width;
#endif

#ifdef USE_RECT
  v_border_radius = u_border_radius;
#endif

  v_linewidth = a_linewidth;
  v_line_color = a_line_color;
  v_fill_color = a_fill_color;
  v_line_cap = a_line_cap;
  v_line_join = a_line_join;

  if (v_linewidth < 1.0) {
    // Linewidth less than 1 is implemented as 1 but with reduced alpha.
    v_line_color.a *= v_linewidth;
    v_linewidth = 1.0;
  }

#ifdef HATCH
  v_hatch_pattern = a_hatch_pattern;
  v_hatch_scale = a_hatch_scale;
  v_hatch_weight = a_hatch_weight;
  v_hatch_color = a_hatch_color;
#endif

  // Coordinates in rotated frame with respect to center of marker, used for
  // distance functions in fragment shader.
  v_coords = a_position*enclosing_size();

#if defined(USE_CIRCLE) || defined(USE_ANNULUS) || defined(USE_ANNULAR_WEDGE) || defined(USE_WEDGE)
  vec2 pos = a_center + v_coords;
#else
  float c = cos(-a_angle);
  float s = sin(-a_angle);
  mat2 rotation = mat2(c, -s, s, c);

  vec2 pos = a_center + rotation*v_coords;
#endif

#ifdef HATCH
  // Coordinates for hatching in unrotated frame of reference.
  v_hatch_coords = pos - 0.5;
#endif

  pos += 0.5; // Make up for Bokeh's offset.
  pos /= u_canvas_size / u_pixel_ratio; // 0 to 1.
  gl_Position = vec4(2.0*pos.x - 1.0, 1.0 - 2.0*pos.y, 0.0, 1.0);
}
