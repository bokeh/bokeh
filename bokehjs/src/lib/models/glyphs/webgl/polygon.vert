precision mediump float;

attribute vec2 a_position;
attribute vec4 a_fill_color;
attribute float a_edge_distance;

#ifdef HATCH
attribute float a_hatch_pattern;
attribute float a_hatch_scale;
attribute float a_hatch_weight;
attribute vec4 a_hatch_color;
#endif

uniform vec2 u_canvas_size;

varying vec4 v_fill_color;
varying float v_edge_distance;

#ifdef HATCH
varying float v_hatch_pattern;
varying float v_hatch_scale;
varying float v_hatch_weight;
varying vec4 v_hatch_color;
varying vec2 v_hatch_coords;
#endif

void main()
{
  v_fill_color = a_fill_color;
  v_edge_distance = a_edge_distance;

#ifdef HATCH
  v_hatch_pattern = a_hatch_pattern;
  v_hatch_scale = a_hatch_scale;
  v_hatch_weight = a_hatch_weight;
  v_hatch_color = a_hatch_color;
  v_hatch_coords = a_position;
#endif

  vec2 pos = a_position + 0.5;  // Bokeh's offset.
  pos /= u_canvas_size;  // in 0..1
  gl_Position = vec4(2.0*pos.x - 1.0, 1.0 - 2.0*pos.y, 0.0, 1.0);
}
