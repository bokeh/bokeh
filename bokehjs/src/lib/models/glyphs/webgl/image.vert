precision mediump float;

attribute vec2 a_position;
attribute vec4 a_bounds;

uniform vec2 u_canvas_size;

varying vec2 v_tex_coords;

void main()
{
  v_tex_coords = vec2(a_position.x < 0.0 ? 0.0 : 1.0, a_position.y < 0.0 ? 0.0 : 1.0);

  float x = a_position.x < 0.0 ? a_bounds[0] : a_bounds[2];
  float y = a_position.y < 0.0 ? a_bounds[1] : a_bounds[3];
  vec2 xy = vec2(x, y);

  vec2 pos = xy + 0.5;  // Bokeh's offset.
  pos /= u_canvas_size;  // in 0..1
  gl_Position = vec4(2.0*pos.x - 1.0, 1.0 - 2.0*pos.y, 0.0, 1.0);
}
