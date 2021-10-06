precision mediump float;

attribute vec2 a_position;
attribute vec2 a_center;
attribute float a_size;
attribute float a_angle;  // in radians
attribute float a_linewidth;
attribute vec4 a_line_color;
attribute vec4 a_fill_color;
attribute float a_show;

uniform float u_pixel_ratio;
uniform vec2 u_canvas_size;
uniform float u_antialias;

varying float v_linewidth;
varying float v_size;
varying vec4 v_line_color;
varying vec4 v_fill_color;
varying vec2 v_coords;

void main()
{
    v_size = a_size;
    v_linewidth = a_linewidth;
    v_line_color = a_line_color;
    v_fill_color = a_fill_color;

    if (a_show < 0.5) {
      // Do not show this marker.
      gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
      return;
    }

    float enclosing_size = v_size + 2.0*v_linewidth + 3.0*u_antialias;

    // Coordinates in rotated frame with respect to center of marker, used in
    // distance functions in fragment shader.
    v_coords = a_position*enclosing_size;

    float c = cos(-a_angle);
    float s = sin(-a_angle);
    mat2 rotation = mat2(c, -s, s, c);

    vec2 pos = a_center + rotation*v_coords;
    pos += 0.5;  // make up for Bokeh's offset
    pos /= u_canvas_size / u_pixel_ratio;  // in 0..1
    gl_Position = vec4(2.0*pos.x - 1.0, 1.0 - 2.0*pos.y, 0.0, 1.0);
}
