precision mediump float;

attribute vec2 a_position;
attribute vec2 a_center;
attribute float a_width;
attribute float a_height;
attribute float a_angle; // In radians
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
uniform float u_size_hint;

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

void main()
{
  if (a_show < 0.5) {
    // Do not show this rect.
    gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
    return;
  }

  v_size = vec2(a_width, a_height);
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

  vec2 enclosing_size;
  // Need extra size of (v_linewidth+u_antialias) if edge of marker parallel to
  // edge of bounding box.  If symmetric spike towards edge then multiply by
  // 1/cos(theta) where theta is angle between spike and bbox edges.
  int size_hint = int(u_size_hint + 0.5);
  if (size_hint == 1)  // Dash
    enclosing_size = vec2(v_size.x + v_linewidth + u_antialias,
                          v_linewidth + u_antialias);
  else if (size_hint == 2)  // Dot
    enclosing_size = 0.25*v_size + u_antialias;
  else if (size_hint == 3)  // Diamond
    enclosing_size = vec2(v_size.x*(2.0/3.0) + (v_linewidth + u_antialias)*1.20185,
                          v_size.y + (v_linewidth + u_antialias)*1.80278);
  else if (size_hint == 4)  // Hex
    enclosing_size = v_size + (v_linewidth + u_antialias)*vec2(2.0/sqrt(3.0), 1.0);
  else if (size_hint == 5)  // Square pin
    enclosing_size = v_size + (v_linewidth + u_antialias)*3.1;
  else if (size_hint == 6)  // Triangle
    enclosing_size = vec2(v_size.x + (v_linewidth + u_antialias)*sqrt(3.0),
                          v_size.y*(2.0/sqrt(3.0)) + (v_linewidth + u_antialias)*2.0);
  else if (size_hint == 7)  // Triangle pin
    enclosing_size = v_size + (v_linewidth + u_antialias)*vec2(4.8, 6.0);
  else if (size_hint == 8)  // Star
    enclosing_size = vec2(v_size.x*0.95106 + (v_linewidth + u_antialias)*3.0,
                          v_size.y + (v_linewidth + u_antialias)*3.2);
  else
    enclosing_size = v_size + v_linewidth + u_antialias;

  // Coordinates in rotated frame with respect to center of marker, used for
  // distance functions in fragment shader.
  v_coords = a_position*enclosing_size;

  float c = cos(-a_angle);
  float s = sin(-a_angle);
  mat2 rotation = mat2(c, -s, s, c);

  vec2 pos = a_center + rotation*v_coords;
#ifdef HATCH
  // Coordinates for hatching in unrotated frame of reference.
  v_hatch_coords = pos - 0.5;
#endif
  pos += 0.5; // Make up for Bokeh's offset.
  pos /= u_canvas_size / u_pixel_ratio; // 0 to 1.
  gl_Position = vec4(2.0*pos.x - 1.0, 1.0 - 2.0*pos.y, 0.0, 1.0);
}
