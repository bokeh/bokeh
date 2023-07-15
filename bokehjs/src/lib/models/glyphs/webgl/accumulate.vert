precision mediump float;

attribute vec2 a_position;
varying vec2 v_tex_coords;

void main()
{
  gl_Position = vec4(a_position.x, a_position.y, 0.0, 1.0);
  v_tex_coords = 0.5*(1.0 + a_position);
}
