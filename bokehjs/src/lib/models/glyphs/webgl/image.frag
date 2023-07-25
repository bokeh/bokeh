precision mediump float;

uniform sampler2D u_tex;
uniform float u_global_alpha;

varying vec2 v_tex_coords;

void main()
{
  vec4 color = texture2D(u_tex, v_tex_coords);
  float alpha = color.a*u_global_alpha;
  gl_FragColor = vec4(color.rgb*alpha, alpha);  // Premultiplied alpha.
}
