precision mediump float;

const int butt_cap   = 0;
const int round_cap  = 1;
const int square_cap = 2;

const int miter_join = 0;
const int round_join = 1;
const int bevel_join = 2;

attribute vec2 a_position;
attribute vec2 a_point_prev;
attribute vec2 a_point_start;
attribute vec2 a_point_end;
attribute vec2 a_point_next;
attribute float a_show_prev;
attribute float a_show_curr;
attribute float a_show_next;
attribute float a_linewidth;
attribute vec4 a_line_color;
attribute float a_line_cap;
attribute float a_line_join;
#ifdef DASHED
attribute float a_length_so_far;
attribute vec4 a_dash_tex_info;
attribute float a_dash_scale;
attribute float a_dash_offset;
#endif

uniform vec2 u_canvas_size;
uniform float u_antialias;
uniform float u_miter_limit;

varying float v_linewidth;
varying vec4 v_line_color;
varying float v_line_cap;
varying float v_line_join;
varying float v_segment_length;
varying vec2 v_coords;
varying float v_flags;  // Boolean flags
varying float v_cos_turn_angle_start;
varying float v_cos_turn_angle_end;
#ifdef DASHED
varying float v_length_so_far;
varying vec4 v_dash_tex_info;
varying float v_dash_scale;
varying float v_dash_offset;
#endif

#define SMALL 1e-6

float cross_z(in vec2 v0, in vec2 v1)
{
    return v0.x*v1.y - v0.y*v1.x;
}

vec2 right_vector(in vec2 v)
{
    return vec2(v.y, -v.x);
}

// Calculate cos/sin turn angle with adjacent segment, and unit normal vector to right
float calc_turn_angle(in bool has_cap, in vec2 segment_right, in vec2 other_right, out vec2 point_right, out float sin_turn_angle)
{
    float cos_turn_angle;
    vec2 diff = segment_right + other_right;
    float len = length(diff);
    if (has_cap || len < SMALL) {
        point_right = segment_right;
        cos_turn_angle = -1.0;  // Turns back on itself.
        sin_turn_angle = 0.0;
    }
    else {
        point_right = diff / len;
        cos_turn_angle = dot(segment_right, other_right);   // cos zero at +/-pi/2, +ve angle is turn right
        sin_turn_angle = cross_z(segment_right, other_right);
    }
    return cos_turn_angle;
}

// If miter too large use bevel join instead
bool miter_too_large(in int join_type, in float cos_turn_angle)
{
    float cos_half_angle_sqr = 0.5*(1.0 + cos_turn_angle);  // Trig identity
    return join_type == miter_join && cos_half_angle_sqr < 1.0 / (u_miter_limit*u_miter_limit);
}

vec2 normalize_check_len(in vec2 vec, in float len)
{
    if (abs(len) < SMALL)
        return vec2(1.0, 0.0);
    else
        return vec / len;
}

vec2 normalize_check(in vec2 vec)
{
    return normalize_check_len(vec, length(vec));
}

void main()
{
    if (a_show_curr < 0.5) {
        // Line segment has non-finite value at one or both ends, do not render.
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    int join_type = int(a_line_join + 0.5);
    int cap_type = int(a_line_cap + 0.5);

    v_linewidth = a_linewidth;
    v_line_color = a_line_color;
    if (v_linewidth < 1.0) {
        // Linewidth less than 1 is implemented as 1 but with reduced alpha.
        v_line_color.a *= v_linewidth;
        v_linewidth = 1.0;
    }

    float halfwidth = 0.5*(v_linewidth + u_antialias);

    vec2 segment_along = a_point_end - a_point_start;
    v_segment_length = length(a_point_end - a_point_start);
    segment_along = normalize_check_len(segment_along, v_segment_length); // unit vector.
    vec2 segment_right = right_vector(segment_along);  // unit vector.
    vec2 xy;

    // in screen coords
    vec2 prev_along = normalize_check(a_point_start - a_point_prev);
    vec2 prev_right = right_vector(prev_along);
    vec2 next_right = right_vector(normalize_check(a_point_next - a_point_end));

    v_coords.y = a_position.y*halfwidth;  // Overwritten later for join points.

    // Start and end cap properties
    bool has_start_cap = a_show_prev < 0.5;
    bool has_end_cap = a_show_next < 0.5;

    // Start and end join properties
    vec2 point_right_start, point_right_end;
    float sin_turn_angle_start, sin_turn_angle_end;
    v_cos_turn_angle_start = calc_turn_angle(has_start_cap, segment_right, prev_right, point_right_start, sin_turn_angle_start);
    v_cos_turn_angle_end = calc_turn_angle(has_end_cap, segment_right, next_right, point_right_end, sin_turn_angle_end);
    float sign_turn_right_start = sin_turn_angle_start >= 0.0 ? 1.0 : -1.0;

    bool miter_too_large_start = !has_start_cap && miter_too_large(join_type, v_cos_turn_angle_start);
    bool miter_too_large_end = !has_end_cap && miter_too_large(join_type, v_cos_turn_angle_end);

    float sign_at_start = -sign(a_position.x);  // +ve at segment start, -ve end.
    vec2 point = sign_at_start > 0.0 ? a_point_start : a_point_end;

    if ( (has_start_cap && sign_at_start > 0.0) ||
         (has_end_cap && sign_at_start < 0.0) ) {
        // Cap.
        xy = point - segment_right*(halfwidth*a_position.y);
        if (cap_type == butt_cap)
            xy -= sign_at_start*0.5*u_antialias*segment_along;
        else
            xy -= sign_at_start*halfwidth*segment_along;
    }
    else if (sign_at_start > 0.0) {
        vec2 inside_point = a_point_start + segment_right*(sign_turn_right_start*halfwidth);
        vec2 prev_outside_point = a_point_start - prev_right*(sign_turn_right_start*halfwidth);

        // join at start.
        if (join_type == round_join || join_type == bevel_join || miter_too_large_start) {
            if (v_cos_turn_angle_start <= 0.0) {  // |turn_angle| > 90 degrees
                xy = a_point_start - segment_right*(halfwidth*a_position.y) - halfwidth*segment_along;
            }
            else {
                if (a_position.x < -1.5) {
                    xy = prev_outside_point;
                    v_coords.y = -dot(xy - a_point_start, segment_right);
                }
                else if (a_position.y*sign_turn_right_start > 0.0) {  // outside corner of turn
                    float d = halfwidth*abs(sin_turn_angle_start);
                    xy = a_point_start - segment_right*(halfwidth*a_position.y) - d*segment_along;
                }
                else {  // inside corner of turn
                    xy = inside_point;
                }
            }
        }
        else {  // miter join
            if (a_position.x < -1.5) {
                xy = prev_outside_point;
                v_coords.y = -dot(xy - a_point_start, segment_right);
            }
            else if (a_position.y*sign_turn_right_start > 0.0) {  // outside corner of turn
                float tan_half_turn_angle = (1.0-v_cos_turn_angle_start) / sin_turn_angle_start;  // Trig identity
                float d = sign_turn_right_start*halfwidth*tan_half_turn_angle;
                xy = a_point_start - segment_right*(halfwidth*a_position.y) - d*segment_along;
            }
            else {  // inside corner if turn
                xy = inside_point;
            }
        }
    }
    else {
        xy = point - segment_right*(halfwidth*a_position.y);
    }

    vec2 pos = xy + 0.5;  // Bokeh's offset.
    pos /= u_canvas_size;  // in 0..1
    gl_Position = vec4(2.0*pos.x - 1.0, 1.0 - 2.0*pos.y, 0.0, 1.0);

    bool turn_right_start = sin_turn_angle_start >= 0.0;
    bool turn_right_end = sin_turn_angle_end >= 0.0;

    v_coords.x = dot(xy - a_point_start, segment_along);
    v_flags = float(int(has_start_cap) +
                    2*int(has_end_cap) +
                    4*int(miter_too_large_start) +
                    8*int(miter_too_large_end) +
                    16*int(turn_right_start) +
                    32*int(turn_right_end));

    v_line_cap = a_line_cap;
    v_line_join = a_line_join;

#ifdef DASHED
    v_length_so_far = a_length_so_far;
    v_dash_tex_info = a_dash_tex_info;
    v_dash_scale = a_dash_scale;
    v_dash_offset = a_dash_offset;
#endif
}
