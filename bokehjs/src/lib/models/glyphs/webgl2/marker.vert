#version 300 es
precision highp float;

// Per-vertex quad geometry (instanced)
layout(location = 0) in vec2 a_position;  // [-0.5, -0.5] to [0.5, 0.5]

// Per-instance attributes
layout(location = 1) in vec2 a_center;      // data coordinates
layout(location = 2) in vec2 a_size;        // width, height (diameter in data units)
layout(location = 3) in vec2 a_angle_aux;   // angle, aux
layout(location = 4) in vec4 a_line_props;  // linewidth, cap, join, show
layout(location = 5) in vec4 a_line_color;
layout(location = 6) in vec4 a_fill_color;

// Transform uniforms (UBO)
uniform TransformBlock {
    vec2 u_canvas_size;
    float u_antialias;
    float u_size_hint;
    vec4 u_border_radius;
    float u_x_scale;
    float u_x_offset;
    float u_y_scale;
    float u_y_offset;
    float u_radius_scale;
    float _pad1;
    float _pad2;
    float _pad3;
};

out vec2 v_coords;
out vec2 v_size;
out float v_linewidth;
out vec4 v_line_color;
out vec4 v_fill_color;

vec2 enclosing_size(vec2 size, float linewidth) {
    return size + linewidth + u_antialias;
}

void main() {
    float linewidth_raw = a_line_props.x;
    float show = a_line_props.w;

    // Early exit for hidden markers
    if (show < 0.5 || a_size.x < 0.0 || a_size.y < 0.0) {
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    // Transform data coordinates to screen coordinates on the GPU
    vec2 screen_center = vec2(
        a_center.x * u_x_scale + u_x_offset,
        a_center.y * u_y_scale + u_y_offset
    );

    // Transform size from data units to screen units
    vec2 screen_size = a_size * u_radius_scale;

    // Determine marker size based on type
    vec2 v_sz;
#ifdef MARKER_CIRCLE
    v_sz = vec2(screen_size.x, screen_size.x);
#else
    v_sz = screen_size;
#endif

    // Adjust line color alpha for thin lines
    float lw = linewidth_raw;
    vec4 lc = a_line_color;
    if (lw < 1.0) {
        lc.a *= lw;
        lw = 1.0;
    }

    // Calculate vertex position in local marker space
    vec2 coords = a_position * enclosing_size(v_sz, lw);

    // Apply rotation
    float angle = a_angle_aux.x;
    float c = cos(-angle);
    float s = sin(-angle);
    mat2 rotation = mat2(c, -s, s, c);
    vec2 pos = screen_center + rotation * coords;

    // Convert to normalized device coordinates
    // Add 0.5 pixel offset for crisp rendering
    pos = pos + 0.5;
    pos = pos / u_canvas_size;

    gl_Position = vec4(2.0 * pos.x - 1.0, 1.0 - 2.0 * pos.y, 0.0, 1.0);

    // Pass to fragment shader
    v_coords = coords;
    v_size = v_sz;
    v_linewidth = lw;
    v_line_color = lc;
    v_fill_color = a_fill_color;
}
