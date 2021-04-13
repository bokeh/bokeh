precision mediump float;

attribute vec2 a_position;
attribute vec2 a_center;
attribute float a_width;
attribute float a_height;
attribute float a_angle; // In radians
attribute float a_linewidth;
attribute vec4 a_line_color;
attribute vec4 a_fill_color;
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

varying float v_linewidth;
varying vec2 v_size; // 2D size for rects compared to 1D for markers.
varying vec4 v_line_color;
varying vec4 v_fill_color;
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

  vec2 enclosing_size = v_size + v_linewidth + u_antialias;

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
