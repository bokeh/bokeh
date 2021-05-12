precision mediump float;

const int butt_cap   = 0;
const int round_cap  = 1;
const int square_cap = 2;

const int miter_join = 0;
const int round_join = 1;
const int bevel_join = 2;

const float missing_point_threshold = -9000.0;

attribute vec2 a_position;
attribute vec2 a_point_prev;
attribute vec2 a_point_start;
attribute vec2 a_point_end;
attribute vec2 a_point_next;
#ifdef DASHED
attribute float a_length_so_far;
#endif

uniform float u_pixel_ratio;
uniform vec2 u_canvas_size;
uniform float u_linewidth;
uniform float u_antialias;
uniform float u_line_join;
uniform float u_line_cap;
uniform float u_miter_limit;

varying float v_segment_length;
varying vec2 v_coords;
varying float v_flags;  // Booleans for start/end caps and miters too long.
varying float v_cos_theta_turn_right_start;  // Sign gives turn_right, abs gives
varying float v_cos_theta_turn_right_end;    //   cos(theta).
#ifdef DASHED
varying float v_length_so_far;
#endif

float cross_z(in vec2 v0, in vec2 v1)
{
    return v0.x*v1.y - v0.y*v1.x;
}

vec2 right_vector(in vec2 v)
{
    return vec2(v.y, -v.x);
}

vec2 line_intersection(in vec2 point0, in vec2 dir0,
                       in vec2 point1, in vec2 dir1)
{
    // Line-line intersection: point0 + lambda0 dir0 = point1 + lambda1 dir1.
    // Not checking if lines are parallel!
    float lambda0 = cross_z(point1 - point0, dir1) / cross_z(dir0, dir1);
    return point0 + lambda0*dir0;
}

void main()
{
    if (a_point_start.x < missing_point_threshold ||
        a_point_end.x < missing_point_threshold) {
        // Line segment has non-finite value at one or both ends, do not render.
        gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
        return;
    }

    const float min_miter_factor_round_join_mesh = sqrt(2.0);

    int join_type = int(u_line_join + 0.5);
    int cap_type = int(u_line_cap + 0.5);
    float halfwidth = 0.5*(u_linewidth + u_antialias);
    vec2 segment_along = normalize(a_point_end - a_point_start); // unit vector.
    v_segment_length = length(a_point_end - a_point_start);
    vec2 segment_right = right_vector(segment_along);  // unit vector.
    vec2 xy;

    bool miter_too_large_start = false;
    bool miter_too_large_end = false;

    v_coords.y = a_position.y*halfwidth;  // Overwritten later for end points.

    bool has_start_cap = a_point_prev.x < missing_point_threshold;
    bool has_end_cap = a_point_next.x < missing_point_threshold;

    vec2 point_normal_start;
    float cos_theta_start;
    float turn_right_start;
    if (has_start_cap)
        point_normal_start = segment_right;
    else {
        vec2 prev_right = right_vector(normalize(a_point_start - a_point_prev));
        point_normal_start = normalize(segment_right + prev_right);
        cos_theta_start = dot(segment_right, point_normal_start);  // Always +ve
        turn_right_start = sign(dot(segment_right, a_point_prev - a_point_start));
    }

    vec2 point_normal_end;
    float cos_theta_end;
    float turn_right_end;
    if (has_end_cap)
        point_normal_end = segment_right;
    else {
        vec2 next_right = right_vector(normalize(a_point_next - a_point_end));
        point_normal_end = normalize(segment_right + next_right);
        cos_theta_end = dot(segment_right, point_normal_end);  // Always +ve
        turn_right_end = sign(dot(segment_right, a_point_next - a_point_end));
    }

    float miter_factor_start = 1.0 / dot(segment_right, point_normal_start);
    float miter_factor_end = 1.0 / dot(segment_right, point_normal_end);
    if (join_type == miter_join) {
        // If miter too large, use bevel join instead.
        miter_too_large_start = (miter_factor_start > u_miter_limit);
        miter_too_large_end = (miter_factor_end > u_miter_limit);
    }

    float sign_at_start = -sign(a_position.x);  // +ve at segment start, -ve end.
    vec2 point = sign_at_start > 0.0 ? a_point_start : a_point_end;
    vec2 adjacent_point =
        sign_at_start > 0.0 ? (has_start_cap ? a_point_start : a_point_prev)
                            : (has_end_cap ? a_point_end : a_point_next);

    if ( (has_start_cap && sign_at_start > 0.0) ||
         (has_end_cap && sign_at_start < 0.0) ) {
        // Cap.
        xy = point - segment_right*(halfwidth*a_position.y);
        if (cap_type == butt_cap)
            xy -= sign_at_start*0.5*u_antialias*segment_along;
        else
            xy -= sign_at_start*halfwidth*segment_along;
    }
    else { // Join.
        // +ve if turning to right, -ve if to left.
        float turn_sign = sign_at_start > 0.0 ? turn_right_start : turn_right_end;

        vec2 adjacent_right = sign_at_start*normalize(right_vector(point - adjacent_point));
        vec2 point_right = normalize(segment_right + adjacent_right);
        float miter_factor = sign_at_start > 0.0 ? miter_factor_start : miter_factor_end;
        bool miter_too_large = sign_at_start > 0.0 ? miter_too_large_start : miter_too_large_end;

        if (abs(a_position.x) > 1.5) {
            // Outer point, meets prev/next segment.
            float factor;  // multiplied by halfwidth...

            if (join_type == bevel_join || (join_type == miter_join && miter_too_large))
                factor = 1.0 / miter_factor;  // cos_theta.
            else if (join_type == round_join &&
                     miter_factor > min_miter_factor_round_join_mesh)
                factor = 1.0;
            else  // miter, or round (small angle only).
                factor = miter_factor;

            xy = point - point_right*(halfwidth*turn_sign*factor);
            v_coords.y = turn_sign*halfwidth*factor / miter_factor;
        }
        else if (turn_sign*a_position.y < 0.0) {
            // Inner point, meets prev/next segment.
            float len = halfwidth*miter_factor;
            float segment_len = v_segment_length;
            float adjacent_len = distance(point, adjacent_point);

            if (len <= min(segment_len, adjacent_len))
                // Normal behaviour.
                xy = point - point_right*(len*a_position.y);
            else
                // For short wide line segments the inner point using the above
                // calculation can be outside of the line.  Here clipping it.
                xy = point + segment_right*(halfwidth*turn_sign);
        }
        else {
            // Point along outside edge.
            xy = point - segment_right*(halfwidth*a_position.y);
            if (join_type == round_join &&
                miter_factor > min_miter_factor_round_join_mesh) {
                xy = line_intersection(xy, segment_along,
                                       point - turn_sign*point_right*halfwidth,
                                       right_vector(point_right));
            }
        }
    }

    vec2 pos = xy + 0.5;  // Bokeh's offset.
    pos /= u_canvas_size / u_pixel_ratio;  // in 0..1
    gl_Position = vec4(2.0*pos.x - 1.0, 1.0 - 2.0*pos.y, 0.0, 1.0);

    v_coords.x = dot(xy - a_point_start, segment_along);
    v_flags = float(int(has_start_cap) +
                    2*int(has_end_cap) +
                    4*int(miter_too_large_start) +
                    8*int(miter_too_large_end));
    v_cos_theta_turn_right_start = cos_theta_start*turn_right_start;
    v_cos_theta_turn_right_end = cos_theta_end*turn_right_end;

#ifdef DASHED
    v_length_so_far = a_length_so_far;
#endif
}
