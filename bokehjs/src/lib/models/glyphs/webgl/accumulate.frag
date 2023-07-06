precision mediump float;

uniform sampler2D u_framebuffer_tex;
varying vec2 v_tex_coords;

void main()
{
  gl_FragColor = texture2D(u_framebuffer_tex, v_tex_coords);
}
