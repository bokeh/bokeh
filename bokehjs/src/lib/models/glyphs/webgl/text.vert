#include <bokeh_vertex_precision>
#include <bokeh_screen_projection>

attribute vec2 a_position;
attribute vec4 a_bounds;
attribute vec4 a_uv;
attribute vec2 a_origin;
attribute float a_angle;
attribute float a_show;

uniform vec2 u_canvas_size;

varying vec2 v_tex_coords;

void main()
{
  vec2 corner = vec2(a_position.x < 0.0 ? 0.0 : 1.0, a_position.y < 0.0 ? 0.0 : 1.0);
  v_tex_coords = mix(a_uv.xy, a_uv.zw, corner);

  vec2 xy = mix(a_bounds.xy, a_bounds.zw, corner);
  if (a_angle != 0.0) {
    vec2 offset = xy - a_origin;
    float c = cos(a_angle);
    float s = sin(a_angle);
    xy = a_origin + vec2(c*offset.x - s*offset.y, s*offset.x + c*offset.y);
  }

  gl_Position = a_show == 0.0
    ? vec4(2.0, 2.0, 0.0, 1.0)
    : bokeh_screen_to_clip(xy, u_canvas_size);
}
