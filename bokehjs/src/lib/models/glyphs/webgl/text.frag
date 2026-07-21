#include <bokeh_fragment_precision>

uniform sampler2D u_tex;

varying vec2 v_tex_coords;

void main()
{
  vec4 color = texture2D(u_tex, v_tex_coords);
  gl_FragColor = vec4(color.rgb*color.a, color.a);
}
