export const vertex_shader: string = `
precision mediump float;
const float SQRT_2 = 1.4142135623730951;
//
uniform float u_pixel_ratio;
uniform vec2 u_canvas_size;
uniform vec2 u_offset;
uniform vec2 u_scale;
uniform float u_antialias;
//
attribute float a_sx;
attribute float a_sy;
attribute float a_size;
attribute float a_angle;  // in radians
attribute float a_linewidth;
attribute vec4  a_fg_color;
attribute vec4  a_bg_color;
//
varying float v_linewidth;
varying float v_size;
varying vec4  v_fg_color;
varying vec4  v_bg_color;
varying vec2  v_rotation;

void main (void)
{
    v_size = a_size * u_pixel_ratio;
    v_linewidth = a_linewidth * u_pixel_ratio;
    v_fg_color = a_fg_color;
    v_bg_color = a_bg_color;
    v_rotation = vec2(cos(-a_angle), sin(-a_angle));
    vec2 pos = vec2(a_sx, a_sy);  // in pixels
    pos += 0.5;  // make up for Bokeh's offset
    pos /= u_canvas_size / u_pixel_ratio;  // in 0..1
    gl_Position = vec4(pos*2.0-1.0, 0.0, 1.0);
    gl_Position.y *= -1.0;
    gl_PointSize = SQRT_2 * v_size + 2.0 * (v_linewidth + 1.5*u_antialias);
}
`
