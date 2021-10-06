precision mediump float;

const int butt_cap   = 0;
const int round_cap  = 1;
const int square_cap = 2;

const int miter_join = 0;
const int round_join = 1;
const int bevel_join = 2;

uniform float u_linewidth;
uniform float u_antialias;
uniform float u_line_join;
uniform float u_line_cap;
uniform vec4 u_line_color;
#ifdef DASHED
uniform sampler2D u_dash_tex;
uniform vec4 u_dash_tex_info;
uniform float u_dash_scale;
uniform float u_dash_offset;
#endif

varying float v_segment_length;
varying vec2 v_coords;
varying float v_flags;
varying float v_cos_theta_turn_right_start;
varying float v_cos_theta_turn_right_end;
#ifdef DASHED
varying float v_length_so_far;
#endif

float cross_z(in vec2 v0, in vec2 v1)
{
    return v0.x*v1.y - v0.y*v1.x;
}

float point_line_side(in vec2 point, in vec2 start, in vec2 end)
{
    // +ve if point to right of line.
    // Alternatively could do dot product with right_vector.
    return cross_z(point - start, end - start);
}

float point_line_distance(in vec2 point, in vec2 start, in vec2 end)
{
    return point_line_side(point, start, end) / distance(start, end);
}

vec2 right_vector(in vec2 v)
{
    return vec2(v.y, -v.x);
}

float bevel_join_distance(in float sign_start, in float halfwidth)
{
    float cos_theta_turn_right = sign_start > 0.0 ? v_cos_theta_turn_right_start
                                                  : v_cos_theta_turn_right_end;
    float cos_theta = abs(cos_theta_turn_right);
    float turn_right = sign(cos_theta_turn_right);
    float distance_along = sign_start > 0.0 ? 0.0 : v_segment_length;

    // In v_coords reference frame (x is along segment, y across).
    vec2 line_start = vec2(distance_along, halfwidth*turn_right);
    float sin_alpha = cos_theta;
    float cos_alpha = sqrt(1.0 - sin_alpha*sin_alpha);
    vec2 line_along = vec2(-sign_start*turn_right*sin_alpha, -cos_alpha);

    return halfwidth + sign_start*point_line_distance(
        v_coords, line_start, line_start+line_along);
}

float cap(in int cap_type, in float x, in float y)
{
    // x is distance along segment in direction away from end of segment,
    // y is distance across segment.
    if (cap_type == butt_cap)
        return max(0.5*u_linewidth - x, abs(y));
    else if (cap_type == square_cap)
        return max(-x, abs(y));
    else  // cap_type == round_cap
        return distance(vec2(min(x, 0.0), y), vec2(0.0, 0.0));
}

float distance_to_alpha(in float dist)
{
    return 1.0 - smoothstep(0.5*(u_linewidth - u_antialias),
                            0.5*(u_linewidth + u_antialias), dist);
}

#ifdef DASHED
float dash_distance(in float x)
{
    // x is in direction of v_coords.x, i.e. along segment.
    float tex_length = u_dash_tex_info.x;
    float tex_offset = u_dash_tex_info.y;
    float tex_dist_min = u_dash_tex_info.z;
    float tex_dist_max = u_dash_tex_info.w;

    // Apply offset.
    x += v_length_so_far - u_dash_scale*tex_offset + u_dash_offset;

    // Interpolate within texture to obtain distance to dash.
    float dist = texture2D(u_dash_tex,
                           vec2(x / (tex_length*u_dash_scale), 0.0)).a;

    // Scale distance within min and max limits.
    dist = tex_dist_min + dist*(tex_dist_max - tex_dist_min);

    return u_dash_scale*dist;
}

mat2 rotation_matrix(in float sign_start)
{
    // Rotation matrix for v_coords from this segment to prev or next segment.
    float cos_theta_turn_right = sign_start > 0.0 ? v_cos_theta_turn_right_start
                                                  : v_cos_theta_turn_right_end;
    float cos_theta = abs(cos_theta_turn_right);
    float turn_right = sign(cos_theta_turn_right);

    float sin_theta = sqrt(1.0 - cos_theta*cos_theta)*sign_start*turn_right;
    float cos_2theta = 2.0*cos_theta*cos_theta - 1.0;
    float sin_2theta = 2.0*sin_theta*cos_theta;
    return mat2(cos_2theta, -sin_2theta, sin_2theta, cos_2theta);
}
#endif

void main()
{
    int join_type = int(u_line_join + 0.5);
    int cap_type = int(u_line_cap + 0.5);
    float halfwidth = 0.5*(u_linewidth + u_antialias);

    // Extract flags.
    int flags = int(v_flags + 0.5);
    bool miter_too_large_end = (flags / 8 > 0);
    flags -= 8*int(miter_too_large_end);
    bool miter_too_large_start = (flags / 4 > 0);
    flags -= 4*int(miter_too_large_start);
    bool has_end_cap = (flags / 2 > 0);
    flags -= 2*int(has_end_cap);
    bool has_start_cap = flags > 0;

    float dist = v_coords.y;  // For straight segment, and miter join.

    if (v_coords.x <= 0.5*u_antialias) {
        // At start of segment, either cap or join.
        if (has_start_cap)
            dist = cap(cap_type, v_coords.x, v_coords.y);
        else if (join_type == round_join)
            dist = distance(v_coords, vec2(0.0, 0.0));
        else if (join_type == bevel_join ||
                 (join_type == miter_join && miter_too_large_start))
            dist = max(abs(dist), bevel_join_distance(1.0, halfwidth));
        // else a miter join which uses the default dist calculation.
    }
    else if (v_coords.x >= v_segment_length - 0.5*u_antialias) {
        // At end of segment, either cap or join.
        if (has_end_cap)
            dist = cap(cap_type, v_segment_length - v_coords.x, v_coords.y);
        else if (join_type == round_join)
            dist = distance(v_coords, vec2(v_segment_length, 0));
        else if ((join_type == bevel_join ||
                 (join_type == miter_join && miter_too_large_end)))
            dist = max(abs(dist), bevel_join_distance(-1.0, halfwidth));
        // else a miter join which uses the default dist calculation.
    }

    float alpha = distance_to_alpha(abs(dist));

#ifdef DASHED
    if (u_dash_tex_info.x >= 0.0) {
        // Dashes in straight segments (outside of joins) are easily calculated.
        dist = dash_distance(v_coords.x);

        if (!has_start_cap && cap_type == butt_cap) {
            if (v_coords.x < 0.5*u_antialias) {
                // Outer of start join rendered solid color or not at all
                // depending on whether corner point is in dash or gap, with
                // antialiased ends.
                dist = (dash_distance(0.0) > 0.0 ? 0.5*u_antialias - v_coords.x
                                                 : -0.5*u_linewidth);

                // Also consider antialiased end of dash just outside corner.
                float end_dist = dash_distance(0.5*u_antialias) + v_coords.x -
                    0.5*u_antialias;
                dist = max(dist, end_dist);
            }

            vec2 prev_coords = rotation_matrix(1.0)*v_coords;

            if (abs(prev_coords.y) < halfwidth &&
                prev_coords.x < 0.5*u_antialias) {
                // Extend dashes across from previous segment, with antialiased
                // end.
                float new_dist = dash_distance(min(prev_coords.x,
                                                   -0.5*u_antialias));

                if (prev_coords.x > -0.5*u_antialias)
                    new_dist -= prev_coords.x + 0.5*u_antialias;

                new_dist = min(new_dist, 0.5*u_linewidth - abs(prev_coords.y));
                dist = max(dist, new_dist);
            }
        }

        if (!has_end_cap && cap_type == butt_cap) {
            if (v_coords.x > v_segment_length - 0.5*u_antialias) {
                // Similar for end join.
                dist = (dash_distance(v_segment_length) > 0.0
                            ? v_coords.x - v_segment_length + 0.5*u_antialias
                            : -0.5*u_linewidth);

                float end_dist =
                    dash_distance(v_segment_length - 0.5*u_antialias) -
                    v_coords.x + v_segment_length - 0.5*u_antialias;
                dist = max(dist, end_dist);
            }

            vec2 next_coords =
                rotation_matrix(-1.0)*(v_coords - vec2(v_segment_length, 0.0));

            if (abs(next_coords.y) < halfwidth &&
                next_coords.x > -0.5*u_antialias) {
                // Extend dashes across from next segment, with antialiased end.
                float new_dist = dash_distance(v_segment_length +
                    max(next_coords.x, 0.5*u_antialias));

                if (next_coords.x < 0.5*u_antialias)
                    new_dist += next_coords.x - 0.5*u_antialias;

                new_dist = min(new_dist, 0.5*u_linewidth - abs(next_coords.y));
                dist = max(dist, new_dist);
            }
        }

        dist = cap(cap_type, dist, v_coords.y);

        float dash_alpha = distance_to_alpha(dist);
        alpha = min(alpha, dash_alpha);
    }
#endif

    alpha = u_line_color.a*alpha;
    gl_FragColor = vec4(u_line_color.rgb*alpha, alpha);  // Premultiplied alpha.
}
