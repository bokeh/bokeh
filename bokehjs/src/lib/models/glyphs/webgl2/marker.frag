#version 300 es
precision highp float;

// Marker type defines (set via preprocessor)
// #define MARKER_CIRCLE
// #define MARKER_RECT
// #define MARKER_ROUND_RECT

in vec2 v_coords;
in vec2 v_size;
in float v_linewidth;
in vec4 v_line_color;
in vec4 v_fill_color;

out vec4 fragColor;

// Transform uniforms (UBO) - shared with vertex shader
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

float circle_sdf(vec2 p, float radius) {
    return length(p) - radius;
}

float rect_sdf(vec2 p, vec2 half_size) {
    vec2 d = abs(p) - half_size;
    return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0);
}

float round_rect_sdf(vec2 p, vec2 half_size, vec4 radius) {
    vec2 r;
    if (p.x > 0.0) {
        if (p.y > 0.0) {
            r = vec2(radius.x);
        } else {
            r = vec2(radius.y);
        }
    } else {
        if (p.y > 0.0) {
            r = vec2(radius.w);
        } else {
            r = vec2(radius.z);
        }
    }
    vec2 q = abs(p) - half_size + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r.x;
}

float marker_sdf(vec2 p, vec2 size) {
#ifdef MARKER_CIRCLE
    return circle_sdf(p, 0.5 * size.x);
#elif defined(MARKER_ROUND_RECT)
    return round_rect_sdf(p, size / 2.0, u_border_radius);
#else
    // Default to rect
    return rect_sdf(p, size / 2.0);
#endif
}

float distance_to_alpha(float dist) {
    return 1.0 - smoothstep(-0.5 * u_antialias, 0.5 * u_antialias, dist);
}

vec4 premultiply_alpha(vec4 color, float alpha) {
    float a = color.a * alpha;
    return vec4(color.rgb * a, a);
}

vec4 blend_over(vec4 src, vec4 dst) {
    return src + (1.0 - src.a) * dst;
}

void main() {
    float dist = marker_sdf(v_coords, v_size);

    // Calculate fill contribution
    float fill_alpha = distance_to_alpha(dist);
    vec4 color = premultiply_alpha(v_fill_color, fill_alpha);

    // Calculate line/stroke contribution
    float line_dist = abs(dist) - 0.5 * v_linewidth;
    float line_alpha = distance_to_alpha(line_dist);

    if (line_alpha > 0.0) {
        vec4 line_color = premultiply_alpha(v_line_color, line_alpha);
        color = blend_over(line_color, color);
    }

    fragColor = color;
}
