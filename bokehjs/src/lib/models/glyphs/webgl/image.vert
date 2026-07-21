#include <bokeh_vertex_precision>
#include <bokeh_screen_projection>

attribute vec2 a_position;
attribute vec4 a_bounds;

uniform vec2 u_canvas_size;
uniform float u_angle;

varying vec2 v_tex_coords;

void main()
{
  v_tex_coords = vec2(a_position.x < 0.0 ? 0.0 : 1.0, a_position.y < 0.0 ? 0.0 : 1.0);

  float x = a_position.x < 0.0 ? a_bounds[0] : a_bounds[2];
  float y = a_position.y < 0.0 ? a_bounds[1] : a_bounds[3];
  vec2 xy = vec2(x, y);
  if (u_angle != 0.0) {
    vec2 center = 0.5*(a_bounds.xy + a_bounds.zw);
    vec2 offset = xy - center;
    float c = cos(u_angle);
    float s = sin(u_angle);
    xy = center + vec2(c*offset.x - s*offset.y, s*offset.x + c*offset.y);
  }

  gl_Position = bokeh_screen_to_clip(xy, u_canvas_size);
}
